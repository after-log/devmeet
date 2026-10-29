// 서버 연동 전까지 쓰는 목업 API. devmeet-mvp 서버(/api/*)와 같은 이름·규칙을 따르고,
// 데이터는 이 브라우저의 localStorage에만 저장한다. 실제 서버로 바꿀 때는 이 파일만 교체하면 된다.
import { members } from '@/data/members';
import { normalizeValueAnswers as cleanValueAnswers } from '@/lib/value-answers';
import type { ValueAnswers } from '@/types';
import type { Connections, Message, Person, Profile, Recommendations, User } from '@/types';

interface Account {
  id: string;
  email: string;
  hash: string;
  salt: string;
  profile: Profile | null;
  created: number;
}
interface Db {
  accounts: Account[];
  session: string | null;
  likes: { sender: string; recipient: string; day: string }[];
  recs: Record<string, { day: string; ids: string[] }>;
  messages: Record<string, Message[]>;
  blocks: { sender: string; recipient: string }[];
  reports: { id: string; sender: string; recipient: string; reason: string; created: number }[];
}

const KEY = 'devmeet.mock.v1';
const empty = (): Db => ({
  accounts: [],
  session: null,
  likes: [],
  recs: {},
  messages: {},
  blocks: [],
  reports: [],
});
let memory: Db | null = null;
const load = (): Db => {
  if (memory) return memory;
  try {
    memory = { ...empty(), ...JSON.parse(localStorage.getItem(KEY) ?? 'null') };
  } catch {
    memory = empty();
  }
  return memory!;
};
const save = (db: Db) => {
  memory = db;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // 저장 공간이 부족하면 이번 방문 동안만 유지한다
  }
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const fail = (status: number, message: string): never => {
  throw new ApiError(status, message);
};
const wait = () => new Promise((resolve) => setTimeout(resolve, 120));
const uuid = () => crypto.randomUUID();
/** 한국 시간 기준 날짜. 추천과 좋아요 횟수가 이 날짜로 바뀐다. */
export const today = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

const sha256 = async (text: string) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const currentAccount = (db: Db) => {
  const account = db.accounts.find((a) => a.id === db.session);
  if (!account) fail(401, '로그인이 필요해요.');
  return account!;
};
const withProfile = (db: Db) => {
  const account = currentAccount(db);
  if (!account.profile) fail(400, '프로필을 먼저 완성해 주세요.');
  return account as Account & { profile: Profile };
};
const toUser = (a: Account): User => ({ id: a.id, email: a.email, profile: a.profile });
const publicPerson = (id: string): Person | null => {
  const m = members.find((x) => x.id === id);
  if (!m) return null;
  const { likesYou: _l, joined: _j, ...person } = m;
  return person;
};
const blocked = (db: Db, me: string, other: string) =>
  db.blocks.some(
    (b) => (b.sender === me && b.recipient === other) || (b.sender === other && b.recipient === me),
  );
const likedMe = (id: string) => !!members.find((m) => m.id === id)?.likesYou;
const isMatch = (db: Db, me: string, other: string) =>
  db.likes.some((l) => l.sender === me && l.recipient === other) &&
  likedMe(other) &&
  !blocked(db, me, other);
/** 역할 조건: 비개발자는 개발자만, 개발자는 고른 선호를 따른다. */
const wantsRole = (p: Profile, m: { role: string }) =>
  (p.role !== 'non-developer' || m.role === 'developer') &&
  (p.preference !== '개발자' || m.role === 'developer') &&
  (p.preference !== '비개발자' || m.role !== 'developer');
const pair = (a: string, b: string) => [a, b].sort().join(':');

const clean = (value: unknown, max: number) =>
  String(value ?? '')
    .trim()
    .slice(0, max);

export const api = {
  async me(): Promise<{ user: User | null }> {
    await wait();
    const db = load();
    const account = db.accounts.find((a) => a.id === db.session);
    return { user: account ? toUser(account) : null };
  },

  async register(email: string, password: string): Promise<{ user: User }> {
    await wait();
    const db = load();
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) fail(400, '이메일 주소를 확인해 주세요.');
    if (password.length < 10) fail(400, '비밀번호는 10자 이상이어야 해요.');
    if (db.accounts.some((a) => a.email === address))
      fail(409, '이미 가입한 이메일이에요. 로그인해 주세요.');
    const salt = uuid();
    const account: Account = {
      id: uuid(),
      email: address,
      salt,
      hash: await sha256(salt + password),
      profile: null,
      created: Date.now(),
    };
    save({ ...db, accounts: [...db.accounts, account], session: account.id });
    return { user: toUser(account) };
  },

  async login(email: string, password: string): Promise<{ user: User }> {
    await wait();
    const db = load();
    const account = db.accounts.find((a) => a.email === email.trim().toLowerCase());
    if (!account || account.hash !== (await sha256(account.salt + password)))
      fail(401, '이메일 또는 비밀번호가 맞지 않아요.');
    save({ ...db, session: account!.id });
    return { user: toUser(account!) };
  },

  async logout() {
    await wait();
    save({ ...load(), session: null });
  },

  async saveProfile(input: Partial<Profile>): Promise<{ profile: Profile }> {
    await wait();
    const db = load();
    const account = currentAccount(db);
    const p: Profile = {
      valueAnswers: cleanValueAnswers(input.valueAnswers ?? account.profile?.valueAnswers),
      name: clean(input.name, 30),
      age: Number(input.age),
      height: Number(input.height),
      location: clean(input.location, 60),
      job: clean(input.job, 60),
      education: clean(input.education, 40),
      role: input.role === 'non-developer' ? 'non-developer' : 'developer',
      meeting: clean(input.meeting, 40),
      contact: clean(input.contact, 40),
      preference: clean(input.preference, 20) || '상관없어요',
      smoking: clean(input.smoking, 30),
      drinking: clean(input.drinking, 30),
      religion: clean(input.religion, 30),
      intro: clean(input.intro, 1000),
      tags: (input.tags ?? [])
        .map((t) => clean(t, 20))
        .filter(Boolean)
        .slice(0, 5),
      photo: String(input.photo ?? ''),
      minAge: Number(input.minAge) || 19,
      maxAge: Number(input.maxAge) || 60,
      region: clean(input.region, 40),
    };
    if (!p.name) fail(400, '프로필 이름을 입력해 주세요.');
    if (!Number.isInteger(p.age) || p.age < 19 || p.age > 80)
      fail(400, '나이는 19~80세 사이의 정수로 입력해 주세요.');
    if (!Number.isFinite(p.height) || p.height < 100 || p.height > 250)
      fail(400, '키는 100~250cm 사이로 입력해 주세요.');
    if (!p.location || p.location.includes('undefined'))
      fail(400, '사는 지역의 시·도와 구·시를 선택해 주세요.');
    if (!p.job) fail(400, '하는 일을 입력해 주세요.');
    if (!p.education) fail(400, '최종 학력을 선택해 주세요.');
    if (!p.meeting) fail(400, '만남 빈도를 선택해 주세요.');
    if (!p.contact) fail(400, '연락 빈도를 선택해 주세요.');
    if (!p.intro) fail(400, '자기소개를 입력해 주세요.');
    if (!p.photo) fail(400, '프로필 사진을 등록해 주세요.');
    if (p.minAge < 19 || p.maxAge > 80 || p.minAge > p.maxAge)
      fail(400, '추천 나이 범위를 확인해 주세요.');
    save({
      ...db,
      accounts: db.accounts.map((a) => (a.id === account.id ? { ...a, profile: p } : a)),
    });
    return { profile: p };
  },

  /** 사진을 640px JPEG로 줄여 data URL로 돌려준다. 서버 연동 시 업로드 주소로 바뀐다. */
  async saveValues(answers: ValueAnswers): Promise<{ profile: Profile }> {
    await wait();
    const db = load();
    const account = withProfile(db);
    const profile = { ...account.profile, valueAnswers: cleanValueAnswers(answers) };
    save({
      ...db,
      accounts: db.accounts.map((a) => (a.id === account.id ? { ...a, profile } : a)),
    });
    return { profile };
  },

  async photo(file: File): Promise<{ photo: string }> {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024)
      fail(400, '10MB 이하의 JPEG·PNG·WebP 사진을 선택해 주세요.');
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return { photo: canvas.toDataURL('image/jpeg', 0.8) };
  },

  async recommendations(): Promise<Recommendations> {
    await wait();
    const db = load();
    const me = withProfile(db);
    const p = me.profile;
    const day = today();
    let ids = db.recs[me.id]?.day === day ? db.recs[me.id].ids : null;
    if (!ids) {
      ids = members
        .filter((m) => m.age >= p.minAge && m.age <= p.maxAge)
        .filter((m) => !p.region || m.location.includes(p.region))
        .filter((m) => wantsRole(p, m))
        .filter((m) => !blocked(db, me.id, m.id))
        // 다른 날 이미 소개한 사람은 뒤로 미뤄 매일 새 얼굴이 보이게 한다
        .map((m) => ({
          m,
          score:
            (m.contact === p.contact ? 2 : 0) +
            (m.meeting === p.meeting ? 2 : 0) +
            (m.likesYou ? 1 : 0) -
            (seen(db, me.id).has(m.id) ? 10 : 0),
        }))
        .sort((a, b) => b.score - a.score || b.m.joined - a.m.joined)
        .slice(0, 3)
        .map(({ m }) => m.id);
      db.recs = { ...db.recs, [me.id]: { day, ids } };
      save(db);
    }
    const liked = db.likes
      .filter((l) => l.sender === me.id && l.day === day)
      .map((l) => l.recipient);
    return {
      people: ids
        .filter((id) => !blocked(db, me.id, id))
        .map(publicPerson)
        .filter((x): x is Person => !!x),
      liked,
      remaining: 3 - liked.length,
      day,
    };
  },

  async like(id: string): Promise<{ matched: boolean }> {
    await wait();
    const db = load();
    const me = withProfile(db);
    const day = today();
    if (!db.recs[me.id]?.ids.includes(id) || db.recs[me.id].day !== day)
      fail(403, '오늘 추천된 사람에게만 좋아요를 보낼 수 있어요.');
    if (blocked(db, me.id, id)) fail(403, '좋아요를 보낼 수 없는 상대예요.');
    if (db.likes.some((l) => l.sender === me.id && l.recipient === id))
      return { matched: isMatch(db, me.id, id) };
    if (db.likes.filter((l) => l.sender === me.id && l.day === day).length >= 3)
      fail(429, '오늘의 좋아요를 모두 사용했어요.');
    db.likes = [...db.likes, { sender: me.id, recipient: id, day }];
    save(db);
    return { matched: isMatch(db, me.id, id) };
  },

  async connections(): Promise<Connections> {
    await wait();
    const db = load();
    const me = withProfile(db);
    const sentIds = db.likes.filter((l) => l.sender === me.id).map((l) => l.recipient);
    const ok = (id: string) => !blocked(db, me.id, id);
    const list = (ids: string[]) =>
      [...new Set(ids)]
        .filter(ok)
        .map(publicPerson)
        .filter((x): x is Person => !!x);
    return {
      sent: list(sentIds),
      // 받은 좋아요도 추천과 같은 역할 조건을 따른다(비개발자에게는 개발자만)
      received: list(
        members.filter((m) => m.likesYou && wantsRole(me.profile, m)).map((m) => m.id),
      ),
      matches: list(sentIds.filter((id) => likedMe(id))),
    };
  },

  async messages(id: string): Promise<{ messages: Message[] }> {
    await wait();
    const db = load();
    const me = withProfile(db);
    if (!isMatch(db, me.id, id)) fail(403, '서로 좋아요를 보낸 상대와만 대화할 수 있어요.');
    return { messages: db.messages[pair(me.id, id)] ?? [] };
  },

  async send(id: string, text: string): Promise<{ message: Message }> {
    await wait();
    const db = load();
    const me = withProfile(db);
    if (!isMatch(db, me.id, id)) fail(403, '서로 좋아요를 보낸 상대와만 대화할 수 있어요.');
    const body = text.trim().slice(0, 1000);
    if (!body) fail(400, '메시지를 입력해 주세요.');
    const message: Message = { id: uuid(), sender: me.id, text: body, created: Date.now() };
    const key = pair(me.id, id);
    db.messages = { ...db.messages, [key]: [...(db.messages[key] ?? []), message] };
    save(db);
    return { message };
  },

  async report(id: string, reason: string): Promise<{ id: string }> {
    await wait();
    const db = load();
    const me = withProfile(db);
    const report = {
      id: uuid(),
      sender: me.id,
      recipient: id,
      reason: clean(reason, 200),
      created: Date.now(),
    };
    save({ ...db, reports: [...db.reports, report] });
    return { id: report.id };
  },

  async block(id: string, remove = false) {
    await wait();
    const db = load();
    const me = withProfile(db);
    const rest = db.blocks.filter((b) => !(b.sender === me.id && b.recipient === id));
    save({ ...db, blocks: remove ? rest : [...rest, { sender: me.id, recipient: id }] });
  },

  async blocks(): Promise<{ people: Person[] }> {
    await wait();
    const db = load();
    const me = withProfile(db);
    return {
      people: db.blocks
        .filter((b) => b.sender === me.id)
        .map((b) => publicPerson(b.recipient))
        .filter((x): x is Person => !!x),
    };
  },
};

function seen(db: Db, me: string) {
  // 오늘 이전에 소개된 사람. 추천 기록은 마지막 날만 보관하므로 좋아요 기록으로 보완한다.
  const ids = new Set(
    db.likes.filter((l) => l.sender === me && l.day !== today()).map((l) => l.recipient),
  );
  const last = db.recs[me];
  if (last && last.day !== today()) last.ids.forEach((id) => ids.add(id));
  return ids;
}
