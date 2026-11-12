import { ArrowRight, Check, ChevronRight, Keyboard, Sparkles } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ProfileBuilt from '@/components/pixel/ProfileBuilt';
import SignupBuildLog from '@/components/pixel/SignupBuildLog';
import { api } from '../lib/api';
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
import type { Draft, Profile, Role } from '@/types';

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
    <span className="symbol">
      {role === 'developer' ? (
        <Keyboard className="ico" aria-hidden="true" />
      ) : (
        <Sparkles className="ico" fill="currentColor" aria-hidden="true" />
      )}
    </span>
    <span>
      <strong>{title}</strong>
      <small>{description}</small>
    </span>
    <span className="end">
      {draft.role === role ? (
        <Check className="ico" aria-hidden="true" />
      ) : (
        <ChevronRight className="ico" aria-hidden="true" />
      )}
    </span>
  </button>
);

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, draft, setDraft, step, setStep, setUser, refresh } = useApp();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const photos = draft.photos ?? (draft.photo ? [draft.photo] : []);
  const updatePhotos = (photos: string[]) => setDraft({ photos, photo: photos[0] ?? '' });
  const [built, setBuilt] = useState<Profile | null>(null);
  const welcomeKey = user ? `devmeet.welcomed.${user.id}` : '';
  const [welcome, setWelcome] = useState(() => {
    try {
      return !!user && !user.profile && !sessionStorage.getItem(welcomeKey);
    } catch {
      return false;
    }
  });
  if (!user) return <Navigate to="/" replace />;
  // 카카오로 처음 가입해 들어왔을 때 '가입 완료' 빌드 로그를 한 번 보여 준다
  if (welcome && !user.profile && step === 0)
    return (
      <SignupBuildLog
        name={draft.name}
        onContinue={() => {
          try {
            sessionStorage.setItem(welcomeKey, '1');
          } catch {
            // 저장 공간이 없으면 이번 화면에서만 닫는다
          }
          setWelcome(false);
        }}
      />
    );
  // 처음 가입한 회원이 저장을 마치면 '빌드 완료' 화면을 한 번 보여 준다
  if (built) return <ProfileBuilt profile={built} onContinue={() => navigate('/today')} />;
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
    photos.length >= 3 && !!draft.intro?.trim(),
  ][step];

  const next = async () => {
    setError('');
    if (step < 3) return setStep(step + 1);
    if (uploading || saving) return;
    if (photos.length < 3) return setError('프로필 사진을 최소 3장 등록해 주세요.');
    if (!draft.intro?.trim()) return setError('자기소개를 입력해 주세요.');
    setSaving(true);
    try {
      const tags = (draft.tagsText ?? (draft.tags ?? []).join(', '))
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5);
      const { profile } = await api.saveProfile({
        ...draft,
        photos,
        location: `${draft.city} ${draft.district}`,
        preference: draft.role === 'non-developer' ? '개발자' : draft.preference,
        tags,
      });
      setUser({ ...user, profile });
      await refresh();
      if (editing) {
        navigate('/me');
        toast('프로필을 저장했어요.');
      } else {
        setBuilt(profile);
        toast('가입이 완료됐어요. 사진 승인 후 추천이 시작돼요.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="pixel-steps"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={screens.length}
        aria-valuenow={step + 1}
        aria-label="프로필 작성 단계"
      >
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
            개발자는 내 정보에서 GitHub 인증을 진행해 주세요. 본인 소유의 계정인지 확인해요.
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
            <h3>프로필 사진 · {photos.length} / 6장</h3>
            <p className="mb-4 text-xs text-fg-3">
              얼굴이 잘 보이는 사진을 최소 3장 등록해 주세요. 첫 번째 사진이 대표 사진이에요.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={photo} className="min-w-0 space-y-2">
                  <img
                    className="aspect-[3/4] w-full rounded-lg object-cover"
                    src={photo}
                    alt={`등록 사진 ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="w-full text-xs text-blue"
                    disabled={uploading || saving || index === 0}
                    onClick={() => updatePhotos([photo, ...photos.filter((p) => p !== photo)])}
                  >
                    {index === 0 ? '대표 사진' : '대표로 설정'}
                  </button>
                  <button
                    type="button"
                    className="w-full text-xs text-fg-3"
                    disabled={uploading || saving}
                    onClick={() => updatePhotos(photos.filter((p) => p !== photo))}
                    aria-label={`사진 ${index + 1} 삭제`}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
            <label className="formlabel" htmlFor="photo">
              {uploading ? '사진 업로드 중…' : '사진 추가하기'}
              <input
                className="mt-2"
                id="photo"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                aria-required="true"
                disabled={uploading || saving || photos.length >= 6}
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (!files.length) return;
                  if (photos.length + files.length > 6) {
                    setError('프로필 사진은 최대 6장까지 등록할 수 있어요.');
                    return;
                  }
                  setUploading(true);
                  setError('');
                  const uploaded = [...photos];
                  try {
                    for (const file of files) {
                      const { photo } = await api.photo(file);
                      uploaded.push(photo);
                      updatePhotos([...uploaded]);
                    }
                    toast('사진을 등록했어요. 저장하면 검수가 시작돼요.');
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
            <p className="footnote text-left">
              사진 전체가 승인된 뒤 프로필에 공개돼요. 사진을 변경하면 다시 검수를 받아요.
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
            등록한 사진은 검수를 거쳐 추천에 표시돼요. 검수 결과는 내 정보에서 확인할 수 있어요.
          </p>
        </>
      )}

      <p className="error" role="alert">
        {error}
      </p>
      <button
        className="btn full"
        disabled={uploading || saving || (!valid && step < 3)}
        onClick={next}
      >
        {saving ? (
          '저장 중…'
        ) : step === 3 ? (
          editing ? (
            '저장하기'
          ) : (
            <>
              사진 검수 요청하고 가입 완료 <ArrowRight className="ico" aria-hidden="true" />
            </>
          )
        ) : (
          <>
            다음 <ArrowRight className="ico" aria-hidden="true" />
          </>
        )}
      </button>
    </>
  );
};
export default OnboardingPage;
