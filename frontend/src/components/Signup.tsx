import { useEffect, useRef, useState } from 'react';
import type { SignupProfile } from '../types';
import { questions } from '../data/questions';
import { ProfilePreview } from './CodeCard';
export const Option = ({
  symbol,
  title,
  description,
  selected,
  onClick,
  badge,
}: {
  symbol: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  badge?: string;
}) => {
  return (
    <button
      className={`option ${selected ? 'selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="symbol">{symbol}</span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      {badge ? (
        <span className={`tag ${selected ? 'ok' : badge === '···' ? 'ing' : ''}`}>{badge}</span>
      ) : (
        <span className="end">{selected ? '✓' : '›'}</span>
      )}
    </button>
  );
};
// Keep existing deep links (2: verification, 3: optional O/X, 4: preference).
const flow = [1, 6, 7, 8, 9, 10, 2, 4, 11];
const screens: Record<number, [string, string, string]> = {
  1: ['ROLE', '어떤 사람인가요?', '역할에 맞는 만남을 준비할게요.'],
  6: ['ABOUT YOU', '먼저, 당신을 알려주세요.', '프로필에 표시할 기본 정보예요.'],
  7: ['YOUR DAY', '어디서, 어떤 일을 하나요?', '가까운 일상 속에서 인연을 찾아요.'],
  8: ['YOUR PROFILE', '조금 더 알아가 볼까요?', '서로를 알아가는 데 필요한 정보예요.'],
  9: ['LIFESTYLE', '일상의 습관은 어떤가요?', '함께할 때 편안한 생활을 생각해요.'],
  10: [
    'FIRST IMPRESSION',
    '당신다운 첫인사를 남겨요.',
    '얼굴이 잘 보이는 사진과 짧은 소개면 충분해요.',
  ],
  2: ['TRUST', '안심하고 만날 수 있도록.', '인증 정보는 공개되지 않고 배지만 남아요.'],
  4: ['PREFERENCE', '누구를 만나고 싶나요?', '마음이 향하는 사람을 알려주세요.'],
  11: ['OUR PACE', '우리의 속도를 맞춰요.', '만남과 연락, 두 가지만 먼저 알려주세요.'],
};
const Signup = ({
  profile,
  onChange,
  step,
  onStep,
  onEnter,
  notify,
}: {
  profile: SignupProfile;
  onChange: (profile: SignupProfile) => void;
  step: number;
  onStep: (step: number) => void;
  onEnter: () => void;
  notify: (text: string) => void;
}) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const latest = useRef(profile);
  latest.current = profile;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const update = (patch: Partial<SignupProfile>) => onChange({ ...profile, ...patch });
  const details = profile.details || {};
  const setDetail = (key: string, value: string) =>
    update({ details: { ...details, [key]: value } });
  const verify = (key: 'email' | 'github') => {
    if (profile[key]) return;
    update({ [key]: 'ing' });
    timers.current.push(
      setTimeout(() => {
        onChange({ ...latest.current, [key]: 'ok' });
        notify('인증 체험이 완료되었어요');
      }, 650),
    );
  };
  const position = flow.indexOf(step);
  const valid = (() => {
    switch (step) {
      case 1:
        return !!profile.role;
      case 6:
        return (
          !!profile.nick.trim() &&
          Number(details.age) >= 19 &&
          Number(details.age) <= 50 &&
          !!details.gender
        );
      case 7:
        return !!details.region && !!details.job?.trim() && !!details.education;
      case 8:
        return (
          Number(details.height) >= 100 &&
          Number(details.height) <= 250 &&
          !!details.body &&
          !!details.religion
        );
      case 9:
        return !!details.smoking && !!details.drinking;
      case 10:
        return !!details.photoName && !!details.bio?.trim();
      case 2:
        return profile.role !== 'dev' || profile.github === 'ok';
      case 4:
        return profile.role === 'other' || !!profile.pref;
      case 11:
        return !!details.meeting && !!details.contact;
      default:
        return true;
    }
  })();
  const next = () => {
    if (step === 6) update({ nick: profile.nick.trim() });
    if (step === 4 && profile.role === 'other') update({ pref: 'dev' });
    onStep(flow[position + 1] ?? 5);
  };
  const back = () => {
    if (step === 3) {
      if (questionIndex) setQuestionIndex(questionIndex - 1);
      else onStep(5);
    } else onStep(position > 0 ? flow[position - 1] : 0);
  };
  const select = (key: string, label: string, options: string[]) => (
    <div key={key}>
      <label className="formlabel" htmlFor={key}>
        {label}
      </label>
      <select
        className="mt-2"
        id={key}
        value={details[key] || ''}
        onChange={(e) => setDetail(key, e.target.value)}
      >
        <option value="" disabled>
          선택해주세요
        </option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
  const input = (key: string, label: string, placeholder: string, numeric = false) => (
    <label className="formlabel" key={key} htmlFor={key}>
      {label}
      <input
        className="mt-2"
        id={key}
        type={numeric ? 'number' : 'text'}
        inputMode={numeric ? 'numeric' : 'text'}
        min={key === 'age' ? 19 : numeric ? 100 : undefined}
        max={key === 'age' ? 50 : numeric ? 250 : undefined}
        value={details[key] || ''}
        placeholder={placeholder}
        onChange={(e) => setDetail(key, e.target.value)}
      />
    </label>
  );
  return (
    <>
      {screens[step] && (
        <>
          <button className="back" onClick={back}>
            ← 이전
          </button>
          <div className="step">
            {flow.map((s, i) => (
              <i key={s} className={i <= position ? 'done' : ''} />
            ))}
          </div>
          <p className="eyebrow">
            {String(position + 1).padStart(2, '0')} / 09 · {screens[step][0]}
          </p>
          <h2 className="onboard-hero">{screens[step][1]}</h2>
          <p className="onboard-lead">{screens[step][2]}</p>
        </>
      )}
      {step === 0 && (
        <>
          <p className="prompt">
            <span>$</span>devmeet init
            <i className="cursor" />
          </p>
          <h2 className="onboard-hero">
            코드 밖에서도,
            <br />
            말이 통하는 사람.
          </h2>
          <p className="onboard-lead">
            개발자와, 개발자를 만나고 싶은 사람.
            <br />
            하루 세 명, 천천히 알아가요.
          </p>
          <ul className="checks">
            <li>
              <b>01</b>GitHub 인증과 선택적 회사 이메일 배지
            </li>
            <li>
              <b>02</b>생활과 가치관이 맞는 사람을 찾아요
            </li>
            <li>
              <b>03</b>서로 좋아할 때 대화가 열려요
            </li>
          </ul>
          <button className="btn full" onClick={() => onStep(1)}>
            카카오로 시작하기 →
          </button>
          <button className="btn secondary mt-[10px] w-full" onClick={onEnter}>
            이미 계정이 있어요 · 바로 둘러보기
          </button>
          <p className="footnote">UI 체험입니다. 실제 카카오 로그인은 연결되어 있지 않아요.</p>
        </>
      )}
      {step === 1 && (
        <>
          <Option
            symbol="⌨"
            title="저는 개발자예요"
            description="GitHub 필수 · 회사 이메일 선택"
            selected={profile.role === 'dev'}
            onClick={() => update({ role: 'dev' })}
          />
          <Option
            symbol="✧"
            title="개발자를 만나고 싶어요"
            description="사진 검수 · 인증된 개발자 추천"
            selected={profile.role === 'other'}
            onClick={() => update({ role: 'other', pref: 'dev' })}
          />
        </>
      )}
      {step === 6 && (
        <>
          <label className="formlabel" htmlFor="nick">
            프로필에 표시될 이름
            <input
              className="mt-2"
              id="nick"
              maxLength={12}
              autoComplete="nickname"
              placeholder="예: 민준"
              value={profile.nick}
              onChange={(e) => update({ nick: e.target.value })}
            />
          </label>
          {input('age', '나이', '19–50세', true)}
          {select('gender', '성별', ['남성', '여성'])}
        </>
      )}
      {step === 7 && (
        <>
          {select('region', '사는 곳 · 시/구', [
            '서울 성동구',
            '서울 마포구',
            '서울 강남구',
            '경기 성남시',
            '경기 수원시',
          ])}
          {input('job', '직업', '예: 백엔드 개발자')}
          {select('education', '최종학력', [
            '고등학교 졸업',
            '전문대 졸업',
            '학사 졸업',
            '석사 졸업',
            '박사 졸업',
          ])}
          <p className="footnote">직장·학교 이름은 가입 후 프로필에서 추가해요.</p>
        </>
      )}
      {step === 8 && (
        <>
          {input('height', '키 (cm)', '예: 175', true)}
          {select('body', '체형', ['보통', '슬림', '탄탄', '통통'])}
          {select('religion', '종교', ['무교', '기독교', '천주교', '불교', '기타'])}
        </>
      )}
      {step === 9 && (
        <>
          {select('smoking', '흡연', ['비흡연', '흡연'])}
          {select('drinking', '음주 빈도', ['마시지 않음', '월 1회', '주 1회', '주 3회 이상'])}
        </>
      )}
      {step === 10 && (
        <>
          <label className="formlabel" htmlFor="photo">
            얼굴이 잘 나온 사진
            <input
              className="mt-2"
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && !file.type.startsWith('image/')) {
                  notify('이미지 파일을 선택해주세요');
                  e.target.value = '';
                  return;
                }
                if (file) setDetail('photoName', file.name);
              }}
            />
          </label>
          {details.photoName && <p className="secure">선택한 사진: {details.photoName}</p>}
          <p className="footnote">24시간 이내 검수 예정 · 실제 업로드는 연결하지 않았어요.</p>
          <label className="formlabel" htmlFor="bio">
            자기소개 · 하는 일
            <textarea
              id="bio"
              className="mt-2 min-h-28 w-full rounded-md border border-border bg-surface p-3 text-sm"
              maxLength={300}
              value={details.bio || ''}
              placeholder="하는 일과 좋아하는 일상을 짧게 소개해주세요."
              onChange={(e) => setDetail('bio', e.target.value)}
            />
          </label>
        </>
      )}
      {step === 2 && (
        <>
          {(['email', ...(profile.role === 'dev' ? ['github'] : [])] as ('email' | 'github')[]).map(
            (key) => (
              <Option
                key={key}
                symbol={key === 'email' ? '@' : 'GH'}
                title={key === 'email' ? '회사 이메일 · 선택' : 'GitHub 계정 · 필수'}
                description={
                  profile[key] === 'ok'
                    ? '확인이 완료되었어요'
                    : profile[key] === 'ing'
                      ? '확인하는 중이에요'
                      : key === 'email'
                        ? '재직 인증 배지를 추가해요'
                        : 'GitHub 계정을 연결해요'
                }
                selected={profile[key] === 'ok'}
                badge={profile[key] === 'ok' ? '✓ done' : profile[key] === 'ing' ? '···' : '인증'}
                onClick={() => verify(key)}
              />
            ),
          )}
          <p className="footnote">인증은 데모로 진행돼요. 회사 이메일은 건너뛸 수 있어요.</p>
        </>
      )}
      {step === 4 && (
        <>
          <Option
            symbol="⌨"
            title="개발자"
            description={
              profile.role === 'other'
                ? '인증된 개발자를 기본으로 추천해요'
                : '일의 언어가 통하는 사람'
            }
            selected={profile.role === 'other' || profile.pref === 'dev'}
            onClick={() => update({ pref: 'dev' })}
          />
          {profile.role === 'dev' && (
            <>
              <Option
                symbol="✧"
                title="비개발자"
                description="새로운 시선을 가진 사람"
                selected={profile.pref === 'other'}
                onClick={() => update({ pref: 'other' })}
              />
              <Option
                symbol="∞"
                title="상관없어요"
                description="마음의 결이 더 중요해요"
                selected={profile.pref === 'all'}
                onClick={() => update({ pref: 'all' })}
              />
            </>
          )}
        </>
      )}
      {step === 11 && (
        <>
          {select('meeting', '만남 빈도', ['주 1–2회', '주말에 한 번', '자유롭게'])}
          {select('contact', '연락 빈도', ['틈틈이 자주', '퇴근 후 집중해서'])}
          <p className="footnote">추가 가치관 질문은 가입 후 천천히 답해도 괜찮아요.</p>
        </>
      )}
      {screens[step] && (
        <button className="btn full" disabled={!valid} onClick={next}>
          {step === 11
            ? '프로필 완성하기 →'
            : step === 2 && profile.role === 'dev' && !valid
              ? 'GitHub 연결 후 계속할 수 있어요'
              : '다음 →'}
        </button>
      )}
      {step === 3 && (
        <>
          <button className="back" onClick={back}>
            ← 이전
          </button>
          <p className="eyebrow">// more about you · optional</p>
          <h2 className="onboard-hero">조금 더 마음을 알아가요.</h2>
          <p className="onboard-lead">추가 질문은 선택이에요. 나중에 답해도 괜찮아요.</p>
          <div className="ox">
            <div className="ox-top">
              <span className="cat">{questions[questionIndex].c}</span>
              <b>
                {questionIndex + 1}
                <span> / 08</span>
              </b>
            </div>
            <p className="ox-q">{questions[questionIndex].t}</p>
          </div>
          <div className="ox-actions">
            {[false, true].map((value) => (
              <button
                key={String(value)}
                className={value ? 'btn' : 'btn secondary'}
                onClick={() => {
                  const ans = [...profile.ans];
                  ans[questionIndex] = value;
                  update({ ans });
                  if (questionIndex === questions.length - 1) onStep(5);
                  else setQuestionIndex(questionIndex + 1);
                }}
              >
                {value ? '○ 네' : '✕ 아니요'}
              </button>
            ))}
          </div>
          <button className="skip" onClick={() => onStep(5)}>
            나중에 답하기
          </button>
        </>
      )}
      {step === 5 && (
        <>
          <p className="eyebrow">// build complete</p>
          <h2 className="onboard-hero">첫인사 준비가 끝났어요.</h2>
          <p className="onboard-lead">이제 오늘의 추천을 만나보세요.</p>
          <ProfilePreview profile={profile} complete />
          <button className="btn full" onClick={onEnter}>
            오늘의 추천 3명 보기 →
          </button>
          <button
            className="skip"
            onClick={() => {
              setQuestionIndex(0);
              onStep(3);
            }}
          >
            추가 가치관 질문 답하기 · 선택
          </button>
          <p className="footnote">
            사진 승인과 인증은 실제 서비스에서 확인해요. 현재는 UI 체험입니다.
          </p>
        </>
      )}
    </>
  );
};
export default Signup;
