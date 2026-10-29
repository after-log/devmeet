import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/mock-api';
import { useApp } from '../stores/app';
import {
  CONTACT,
  DRINKING,
  EDUCATION,
  MEETING,
  PREFERENCE,
  REGIONS,
  RELIGION,
  SMOKING,
  splitLocation,
} from '@/data/options';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { Select } from '@/components/ui/select';
import type { Draft, Role } from '@/types';

const screens: [string, ReactNode, string][] = [
  [
    'ROLE',
    <>
      어떤 인연을
      <br />
      찾고 있나요?
    </>,
    '나에게 맞는 소개를 위해 먼저 알려주세요.',
  ],
  [
    'ABOUT YOU',
    <>
      당신의 일상을
      <br />
      조금 들려주세요.
    </>,
    '프로필에 표시할 기본 정보예요.',
  ],
  [
    'OUR PACE',
    <>
      좋은 관계의 리듬은
      <br />
      사람마다 다르니까요.
    </>,
    '만남과 연락의 속도, 생활 습관을 알려주세요.',
  ],
  [
    'FIRST IMPRESSION',
    <>
      조금 더,
      <br />
      당신다운 소개.
    </>,
    '사진과 소개글은 추천받은 사람에게 공개돼요.',
  ],
];

const RoleOption = ({
  role,
  title,
  description,
  draft,
  pick,
}: {
  role: Role;
  title: string;
  description: string;
  draft: Draft;
  pick: (r: Role) => void;
}) => (
  <button
    className={`option ${draft.role === role ? 'selected' : ''}`}
    aria-pressed={draft.role === role}
    onClick={() => pick(role)}
  >
    <span className="symbol">{role === 'developer' ? '⌨' : '✧'}</span>
    <span>
      <strong>{title}</strong>
      <small>{description}</small>
    </span>
    <span className="end">{draft.role === role ? '✓' : '›'}</span>
  </button>
);

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, draft, setDraft, step, setStep, setUser, refresh } = useApp();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  if (!user) return <Navigate to="/" replace />;
  const editing = !!user.profile;

  // 예전 형식("서울 성동구")도 드롭다운에서 고른 상태로 보이게 한다
  if (draft.city === undefined && draft.location) {
    const parts = splitLocation(draft.location);
    queueMicrotask(() => setDraft(parts));
  }
  const set = (key: keyof Draft) => (value: string) => setDraft({ [key]: value } as Draft);
  const input = (
    key: 'name' | 'age' | 'height' | 'job',
    label: string,
    placeholder: string,
    numeric = false,
  ) => (
    <label className="formlabel" htmlFor={key}>
      {label}
      <input
        className="mt-2"
        id={key}
        type={numeric ? 'number' : 'text'}
        inputMode={numeric ? 'numeric' : 'text'}
        min={key === 'age' ? 19 : key === 'height' ? 100 : undefined}
        max={key === 'age' ? 80 : key === 'height' ? 250 : undefined}
        maxLength={key === 'name' ? 30 : 60}
        placeholder={placeholder}
        value={draft[key] ?? ''}
        onChange={(e) =>
          setDraft({
            [key]: numeric
              ? e.target.value === ''
                ? undefined
                : Number(e.target.value)
              : e.target.value,
          } as Draft)
        }
      />
    </label>
  );
  const select = (key: keyof Draft, label: string, options: string[]) =>
    options.length === 2 ? (
      <ChoiceGroup
        key={key}
        id={key}
        label={label}
        options={options}
        value={String(draft[key] ?? '')}
        onValueChange={set(key)}
      />
    ) : (
      <div key={key}>
        <label className="formlabel" htmlFor={key}>
          {label}
        </label>
        <Select
          className="mt-2"
          id={key}
          value={String(draft[key] ?? '')}
          onValueChange={set(key)}
          options={options}
        />
      </div>
    );

  const valid = [
    !!draft.role,
    !!draft.name?.trim() &&
      Number.isInteger(Number(draft.age)) &&
      Number(draft.age) >= 19 &&
      Number(draft.age) <= 80 &&
      Number(draft.height) >= 100 &&
      Number(draft.height) <= 250 &&
      !!draft.city &&
      !!draft.district &&
      !!draft.job?.trim() &&
      !!draft.education,
    !!draft.meeting && !!draft.contact && !!draft.smoking && !!draft.drinking && !!draft.religion,
    !!draft.photo && !!draft.intro?.trim(),
  ][step];

  const next = async () => {
    setError('');
    if (step < 3) return setStep(step + 1);
    if (!draft.photo) return setError('프로필 사진을 먼저 등록해 주세요.');
    if (!draft.intro?.trim()) return setError('자기소개를 입력해 주세요.');
    try {
      const tags = (draft.tagsText ?? (draft.tags ?? []).join(', '))
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5);
      const { profile } = await api.saveProfile({
        ...draft,
        location: `${draft.city} ${draft.district}`,
        preference: draft.role === 'non-developer' ? '개발자' : draft.preference,
        tags,
      });
      setUser({ ...user, profile });
      await refresh();
      navigate(editing ? '/me' : '/today');
      toast(editing ? '프로필을 저장했어요.' : `${profile.name}님을 위한 오늘의 추천이 준비됐어요`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <button
        className="back"
        onClick={() => (step ? setStep(step - 1) : navigate(editing ? '/me' : '/'))}
      >
        ← {step ? '이전' : editing ? '내 정보' : '처음으로'}
      </button>
      <div className="step">
        {screens.map((_, i) => (
          <i key={i} className={i <= step ? 'done' : ''} />
        ))}
      </div>
      <p className="eyebrow">
        {String(step + 1).padStart(2, '0')} / 04 · {screens[step][0]}
      </p>
      <h2 className="onboard-hero">{screens[step][1]}</h2>
      <p className="onboard-lead">{screens[step][2]}</p>

      {step === 0 && (
        <>
          <RoleOption
            role="developer"
            title="저는 개발자예요"
            description="개발자와 비개발자를 소개받을 수 있어요."
            draft={draft}
            pick={(role) => setDraft({ role })}
          />
          <RoleOption
            role="non-developer"
            title="개발자를 만나고 싶어요"
            description="개발자 역할을 선택한 분을 소개해요."
            draft={draft}
            pick={(role) => setDraft({ role, preference: '개발자' })}
          />
          <p className="footnote">
            GitHub 소유 확인은 준비 중이에요. 지금은 본인이 고른 역할을 그대로 보여 줘요.
          </p>
        </>
      )}

      {step === 1 && (
        <>
          {input('name', '프로필 이름', '예: 지원')}
          <div className="grid grid-cols-2 gap-2">
            {input('age', '나이', '19–80', true)}
            {input('height', '키 (cm)', '예: 172', true)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="formlabel" htmlFor="city">
                사는 지역
              </label>
              <Select
                className="mt-2"
                id="city"
                placeholder="시·도 선택"
                value={draft.city ?? ''}
                onValueChange={(city) => setDraft({ city, district: '' })}
                options={Object.keys(REGIONS)}
              />
            </div>
            <div>
              <label className="formlabel" htmlFor="district">
                구·시
              </label>
              <Select
                className="mt-2"
                id="district"
                placeholder={draft.city ? '구·시 선택' : '시·도 먼저'}
                disabled={!draft.city}
                value={draft.district ?? ''}
                onValueChange={(district) => setDraft({ district })}
                options={draft.city ? REGIONS[draft.city] : []}
              />
            </div>
          </div>
          {input('job', '하는 일', '예: 백엔드 개발자')}
          {select('education', '최종 학력', EDUCATION)}
        </>
      )}

      {step === 2 && (
        <>
          {select('meeting', '만남 빈도', MEETING)}
          {select('contact', '연락 빈도', CONTACT)}
          {draft.role === 'developer' && select('preference', '만나고 싶은 사람', PREFERENCE)}
          {select('smoking', '흡연', SMOKING)}
          {select('drinking', '음주', DRINKING)}
          {select('religion', '종교', RELIGION)}
        </>
      )}

      {step === 3 && (
        <>
          <div className="panel photo-required">
            <p className="section-comment">// profile.photo · required</p>
            {draft.photo ? (
              <img className="upload-preview" src={draft.photo} alt="올린 프로필 사진" />
            ) : null}
            <label className="formlabel mt-0" htmlFor="photo">
              프로필 사진 · 필수
              <input
                className="mt-2"
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-required="true"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const { photo } = await api.photo(file);
                    setDraft({ photo });
                    setError('');
                    toast('사진을 등록했어요.');
                  } catch (err) {
                    toast((err as Error).message);
                    e.target.value = '';
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
            <p className="footnote text-left">
              {draft.photo
                ? '사진을 바꾸려면 다시 선택하세요.'
                : '얼굴이 잘 보이는 사진 한 장을 올려 주세요.'}
            </p>
          </div>
          <label className="formlabel" htmlFor="intro">
            자기소개
            <textarea
              id="intro"
              className="mt-2 min-h-28 w-full rounded-md border border-line-strong bg-surface p-3 text-sm text-fg"
              maxLength={1000}
              placeholder="일상과 좋아하는 것들을 들려주세요."
              value={draft.intro ?? ''}
              onChange={(e) => setDraft({ intro: e.target.value })}
            />
          </label>
          <label className="formlabel" htmlFor="tags">
            나를 표현하는 태그 · 쉼표로 최대 5개
            <input
              className="mt-2"
              id="tags"
              maxLength={120}
              placeholder="산책, 커피, 독서"
              value={draft.tagsText ?? (draft.tags ?? []).join(', ')}
              onChange={(e) => setDraft({ tagsText: e.target.value })}
            />
          </label>
          <p className="footnote">
            서버 연동 전이라 사진은 이 브라우저에만 저장돼요. 인증 완료 표시는 붙이지 않아요.
          </p>
        </>
      )}

      <p className="error" role="alert">
        {error}
      </p>
      <button className="btn full" disabled={!valid && step < 3} onClick={next}>
        {step === 3 ? (editing ? '저장하기' : '저장하고 시작하기 →') : '다음 →'}
      </button>
    </>
  );
};
export default OnboardingPage;
