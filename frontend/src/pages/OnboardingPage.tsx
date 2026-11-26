import { Controller } from 'react-hook-form';
import { useSchemaForm } from '@/hooks/useSchemaForm';
import { createOnboardingSchema } from '@/validation/profile';
import { FormErrors } from '@/components/ui/form-errors';
import { ArrowRight, Check, ChevronRight, Keyboard, Sparkles } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ProfilePhotoFields from '@/components/ProfilePhotoFields';
import ProfileBuilt from '@/components/pixel/ProfileBuilt';
import SignupWelcome from '@/components/pixel/SignupWelcome';
import { useProfileMutations } from '@/hooks/queries/useProfileMutations';
import { useApp } from '../stores/app';
import {
  CONTACT,
  DRINKING,
  EDUCATION,
  GENDERS,
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
  const profileMutations = useProfileMutations();
  const navigate = useNavigate();
  const { user, draft, setDraft, step, setStep } = useApp();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const photos = draft.photos ?? (draft.photo ? [draft.photo] : []);
  const form = useSchemaForm(createOnboardingSchema(step), {
    values: { ...draft, photos, tagsText: draft.tagsText ?? draft.tags?.join(', ') ?? '' },
  });
  useEffect(() => {
    void form.trigger();
  }, [step, form.trigger]);
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
  // 카카오로 처음 가입해 들어왔을 때 환영 장면을 한 번 보여 준다
  if (welcome && !user.profile && step === 0)
    return (
      <SignupWelcome
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
  if (user.profile && !saving) return <Navigate to="/me/edit" replace />;

  // 예전 형식("서울 성동구")도 드롭다운에서 고른 상태로 보이게 한다
  if (draft.city === undefined && draft.location) {
    const parts = splitLocation(draft.location);
    queueMicrotask(() => setDraft(parts));
  }
  const set = (key: keyof Draft) => (value: string) => {
    form.setValue(key, value, { shouldValidate: true });
    setDraft({ [key]: value } as Draft);
  };
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
        {...form.register(key, {
          valueAsNumber: numeric,
          onChange: (event) =>
            setDraft({
              [key]: numeric
                ? event.target.value === ''
                  ? undefined
                  : Number(event.target.value)
                : event.target.value,
            } as Draft),
        })}
      />
    </label>
  );
  const select = (key: keyof Draft, label: string, options: string[]) => (
    <Controller
      key={key}
      name={key}
      control={form.control}
      render={({ field }) =>
        options.length === 2 ? (
          <ChoiceGroup
            id={key}
            label={label}
            options={options}
            value={String(field.value ?? '')}
            onValueChange={(value) => {
              field.onChange(value);
              set(key)(value);
            }}
          />
        ) : (
          <div>
            <label className="formlabel" htmlFor={key}>
              {label}
            </label>
            <Select
              className="mt-2"
              id={key}
              value={String(field.value ?? '')}
              onValueChange={(value) => {
                field.onChange(value);
                set(key)(value);
              }}
              options={options}
            />
          </div>
        )
      }
    />
  );

  const valid = form.formState.isValid;

  const next = async () => {
    setError('');
    if (!(await form.trigger())) return;
    if (step < 3) return setStep(step + 1);
    if (uploading || saving) return;
    setSaving(true);
    try {
      const tags = (draft.tagsText ?? (draft.tags ?? []).join(', '))
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const { profile } = await profileMutations.saveProfile({
        ...draft,
        photos,
        location: `${draft.city} ${draft.district}`,
        preference: draft.role === 'non-developer' ? '개발자' : draft.preference,
        tags,
      });
      setBuilt(profile);
      toast('가입이 완료됐어요. 사진 승인 후 추천이 시작돼요.');
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
            pick={(role) => {
              form.setValue('role', role, { shouldValidate: true });
              setDraft({ role });
            }}
          />
          <RoleOption
            role="non-developer"
            title="개발자를 만나고 싶어요"
            description="개발자 역할을 선택한 분을 소개해요."
            draft={draft}
            pick={(role) => {
              form.setValue('role', role, { shouldValidate: true });
              setDraft({ role, preference: '개발자' });
            }}
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
          {select('gender', '성별', [...GENDERS])}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="formlabel" htmlFor="city">
                사는 지역
              </label>
              <Controller
                name="city"
                control={form.control}
                render={({ field }) => (
                  <Select
                    className="mt-2"
                    id="city"
                    placeholder="시·도 선택"
                    value={field.value ?? ''}
                    onValueChange={(city) => {
                      field.onChange(city);
                      form.setValue('district', '', { shouldValidate: true });
                      setDraft({ city, district: '' });
                    }}
                    options={Object.keys(REGIONS)}
                  />
                )}
              />
            </div>
            <div>
              <label className="formlabel" htmlFor="district">
                구·시
              </label>
              <Controller
                name="district"
                control={form.control}
                render={({ field }) => (
                  <Select
                    className="mt-2"
                    id="district"
                    placeholder="구·시 선택"
                    value={field.value ?? ''}
                    onValueChange={(district) => {
                      field.onChange(district);
                      setDraft({ district });
                    }}
                    options={REGIONS[draft.city ?? ''] ?? []}
                  />
                )}
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
            <p className="section-comment">사진 · 필수</p>
            <h3>프로필 사진 · {photos.length} / 6장</h3>
            <ProfilePhotoFields
              photos={photos}
              uploading={uploading}
              saving={saving}
              onChange={updatePhotos}
              uploadPhoto={profileMutations.photo}
              onUploadingChange={setUploading}
              onError={setError}
            />
          </div>
          <label className="formlabel" htmlFor="intro">
            자기소개
            <textarea
              id="intro"
              className="mt-2 min-h-28 w-full rounded-md border border-line-strong bg-surface p-3 text-sm text-fg"
              maxLength={1000}
              placeholder="일상과 좋아하는 것들을 들려주세요."
              {...form.register('intro', {
                onChange: (event) => setDraft({ intro: event.target.value }),
              })}
            />
          </label>
          <label className="formlabel" htmlFor="tags">
            나를 표현하는 태그 · 쉼표로 최대 5개
            <input
              className="mt-2"
              id="tags"
              maxLength={120}
              placeholder="산책, 커피, 독서"
              {...form.register('tagsText', {
                onChange: (event) => setDraft({ tagsText: event.target.value }),
              })}
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
      <FormErrors errors={form.formState.errors} />
      <button
        className="btn full"
        disabled={uploading || saving || (!valid && step < 3)}
        onClick={next}
      >
        {saving ? (
          '저장 중…'
        ) : step === 3 ? (
          <>
            사진 검수 요청하고 가입 완료 <ArrowRight className="ico" aria-hidden="true" />
          </>
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
