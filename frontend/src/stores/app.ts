import { create } from 'zustand';
import { api } from '../lib/mock-api';
import { demoPeople } from '../data/members';
import type { Connections, Draft, Message, Person, User } from '../types';

export type Sheet =
  | { kind: 'filters' }
  | { kind: 'safety'; id: string }
  | { kind: 'report'; id: string }
  | { kind: 'blocked' }
  | { kind: 'social' }
  | { kind: 'privacy' }
  | null;

const emptyConnections = (): Connections => ({ sent: [], received: [], matches: [] });
export const freshDraft = (): Draft => ({
  role: 'developer',
  meeting: '주말에 1–2번',
  contact: '바쁜 날에도 짧은 안부',
  preference: '상관없어요',
  smoking: '비흡연',
  drinking: '마시지 않아요',
  religion: '무교',
  education: '대학교 졸업',
  minAge: 19,
  maxAge: 60,
});

interface AppState {
  booted: boolean;
  user: User | null;
  demo: boolean;
  people: Person[];
  liked: string[];
  remaining: number;
  index: number;
  connections: Connections;
  demoMessages: Record<string, Message[]>;
  draft: Draft;
  step: number;
  sheet: Sheet;
  boot: () => Promise<void>;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
  setIndex: (index: number) => void;
  like: (person: Person) => Promise<boolean>;
  startDemo: () => void;
  exitDemo: () => void;
  setDraft: (patch: Draft) => void;
  resetDraft: (draft?: Draft) => void;
  setStep: (step: number) => void;
  openSheet: (sheet: Sheet) => void;
  logout: () => Promise<void>;
  demoSend: (id: string, text: string) => void;
  demoBlock: (id: string) => void;
}

export const useApp = create<AppState>()((set, get) => ({
  booted: false,
  user: null,
  demo: false,
  people: [],
  liked: [],
  remaining: 3,
  index: 0,
  connections: emptyConnections(),
  demoMessages: {},
  draft: freshDraft(),
  step: 0,
  sheet: null,
  boot: async () => {
    const { user } = await api.me();
    set({ user });
    // 추천·매칭을 먼저 불러온 뒤 화면을 그려야 /chat/:id 같은 주소로 바로 들어와도 튕기지 않는다
    if (user?.profile)
      await get()
        .refresh()
        .catch(() => undefined);
    set({ booted: true });
  },
  setUser: (user) => set({ user }),
  refresh: async () => {
    if (get().demo || !get().user?.profile) return;
    const [r, connections] = await Promise.all([api.recommendations(), api.connections()]);
    set((s) => ({
      people: r.people,
      liked: r.liked,
      remaining: r.remaining,
      connections,
      index: Math.min(s.index, Math.max(0, r.people.length - 1)),
    }));
  },
  setIndex: (index) => set({ index }),
  like: async (person) => {
    const s = get();
    if (s.liked.includes(person.id)) return false;
    if (s.demo) {
      // 둘러보기에서는 서로 좋아요를 보낸 것처럼 바로 매칭을 보여 준다
      set({
        liked: [...s.liked, person.id],
        remaining: s.remaining - 1,
        connections: {
          sent: [...s.connections.sent, person],
          received: [...s.connections.received, person],
          matches: [...s.connections.matches, person],
        },
      });
      return true;
    }
    const { matched } = await api.like(person.id);
    await get().refresh();
    return matched;
  },
  startDemo: () =>
    set({
      demo: true,
      people: demoPeople,
      liked: [],
      remaining: 3,
      index: 0,
      connections: emptyConnections(),
      demoMessages: {},
    }),
  exitDemo: () => {
    set({
      demo: false,
      people: [],
      liked: [],
      remaining: 3,
      index: 0,
      connections: emptyConnections(),
      demoMessages: {},
    });
    void get().refresh();
  },
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  resetDraft: (draft) => set({ draft: draft ?? freshDraft(), step: 0 }),
  setStep: (step) => set({ step }),
  openSheet: (sheet) => set({ sheet }),
  logout: async () => {
    if (get().demo) return get().exitDemo();
    await api.logout();
    set({
      user: null,
      people: [],
      liked: [],
      remaining: 3,
      index: 0,
      connections: emptyConnections(),
    });
  },
  demoSend: (id, text) =>
    set((s) => ({
      demoMessages: {
        ...s.demoMessages,
        [id]: [
          ...(s.demoMessages[id] ?? []),
          { id: crypto.randomUUID(), sender: 'demo-me', text, created: Date.now() },
        ],
      },
    })),
  demoBlock: (id) =>
    set((s) => ({
      people: s.people.filter((p) => p.id !== id),
      connections: {
        sent: s.connections.sent.filter((p) => p.id !== id),
        received: s.connections.received.filter((p) => p.id !== id),
        matches: s.connections.matches.filter((p) => p.id !== id),
      },
    })),
}));

/** 같은 화면에서 쓰는 사람 찾기: 오늘의 추천 → 보낸·받은 좋아요 → 매칭 순으로 찾는다. */
export const findPerson = (id?: string) => {
  const s = useApp.getState();
  return [
    ...s.people,
    ...s.connections.sent,
    ...s.connections.received,
    ...s.connections.matches,
  ].find((p) => p.id === id);
};

/** 추천 이유: 퍼센트 대신 같은 답을 한 항목으로 설명한다. */
export const reasonFor = (p: Person) => {
  const me = useApp.getState().user?.profile ?? useApp.getState().draft;
  if (p.meeting === me.meeting && p.contact === me.contact)
    return '만나는 빈도와 연락하는 리듬이 비슷해요.';
  if (p.meeting === me.meeting) return '만나고 싶은 횟수가 잘 맞아요.';
  if (p.contact === me.contact) return '연락하는 리듬이 잘 맞아요.';
  return '서로의 새로운 일상을 알아가 보세요.';
};
