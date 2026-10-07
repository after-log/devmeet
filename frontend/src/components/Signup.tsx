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
  const verify = (key: 'email' | 'github') => {
    if (profile[key]) return;
    update({ [key]: 'ing' });
    timers.current.push(
      setTimeout(() => {
        onChange({ ...latest.current, [key]: 'ok' });
        notify(key === 'email' ? '회사 이메일 인증이 완료되었어요' : 'GitHub 계정을 연결했어요');
      }, 650),
    );
  };
  const answer = (value: boolean | null) => {
    const ans = [...profile.ans];
    ans[questionIndex] = value;
    update({ ans });
    if (questionIndex === questions.length - 1) onStep(4);
    else setQuestionIndex(questionIndex + 1);
  };
  const back = () => {
    if (step === 3 && questionIndex > 0) setQuestionIndex(questionIndex - 1);
    else {
      if (step === 4) setQuestionIndex(questions.length - 1);
      onStep(step - 1);
    }
  };
  const q = questions[questionIndex];
  const verified = profile.email === 'ok' && (profile.role !== 'dev' || profile.github === 'ok');
  return (
    <>
      {step > 0 && step < 5 && (
        <>
          <button className="back" onClick={back}>
            ← 이전
          </button>
          <div className="step">
            {[1, 2, 3, 4].map((i) => (
              <i key={i} className={i <= step ? 'done' : ''} />
            ))}
          </div>
          <p className="eyebrow">
            0{step} / 04 · {['', 'IDENTITY', 'TRUST', 'VALUES', 'PREFERENCE'][step]}
          </p>
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
            검증된 개발자와, 개발자를 만나고 싶은 사람.
            <br />
            가입은 1분이면 끝나요.
          </p>
          <ul className="checks">
            <li>
              <b>01</b>회사 이메일과 GitHub로 신원을 확인해요
            </li>
            <li>
              <b>02</b>가치관 O/X 8문항으로 결이 맞는 사람을 찾아요
            </li>
            <li>
              <b>03</b>서로 호감을 보냈을 때만 대화가 열려요
            </li>
          </ul>
          <button className="btn full" onClick={() => onStep(1)}>
            계정 만들기 →
          </button>
          <button className="btn secondary mt-[10px] w-full" onClick={onEnter}>
            이미 계정이 있어요 · 바로 둘러보기
          </button>
          <p className="footnote">입력한 정보는 추천에만 쓰이고, 인증 내용은 공개되지 않아요.</p>
        </>
      )}
      {step === 1 && (
        <>
          <h2 className="onboard-hero">어떤 사람인가요?</h2>
          <p className="onboard-lead">역할에 따라 꼭 필요한 인증만 요청해요.</p>
          <Option
            symbol="⌨"
            title="저는 개발자예요"
            description="회사 이메일 · GitHub로 인증해요"
            selected={profile.role === 'dev'}
            onClick={() => update({ role: 'dev' })}
          />
          <Option
            symbol="✧"
            title="개발자를 만나고 싶어요"
            description="회사 이메일만 인증하면 돼요"
            selected={profile.role === 'other'}
            onClick={() => update({ role: 'other' })}
          />
          <label className="formlabel" htmlFor="nick">
            프로필에 표시될 이름
          </label>
          <input
            id="nick"
            maxLength={12}
            autoComplete="off"
            placeholder="예: 민준"
            value={profile.nick}
            onChange={(e) => update({ nick: e.target.value })}
          />
          <ProfilePreview profile={profile} />
          <button
            className="btn full"
            disabled={!profile.role || !profile.nick.trim()}
            onClick={() => {
              update({ nick: profile.nick.trim() });
              onStep(2);
            }}
          >
            다음 →
          </button>
          <p className="footnote">이름은 언제든 바꿀 수 있어요.</p>
        </>
      )}
      {step === 2 && (
        <>
          <h2 className="onboard-hero">
            딱 한 번,
            <br />
            신뢰를 확인해요.
          </h2>
          <p className="onboard-lead">인증 정보는 공개되지 않고, 프로필에는 배지만 남아요.</p>
          {(['email', ...(profile.role === 'dev' ? ['github'] : [])] as ('email' | 'github')[]).map(
            (key) => (
              <Option
                key={key}
                symbol={key === 'email' ? '@' : 'GH'}
                title={key === 'email' ? '회사 이메일' : 'GitHub 계정'}
                description={
                  profile[key] === 'ok'
                    ? '확인이 완료되었어요'
                    : profile[key] === 'ing'
                      ? '확인하는 중이에요'
                      : key === 'email'
                        ? '회사 도메인으로 재직을 확인해요'
                        : '활동 이력으로 직무를 교차 확인해요'
                }
                selected={profile[key] === 'ok'}
                badge={profile[key] === 'ok' ? '✓ done' : profile[key] === 'ing' ? '···' : '인증'}
                onClick={() => verify(key)}
              />
            ),
          )}
          <div className="panel secure">
            <p className="eyebrow">// why verify</p>개발자 사칭과 허위 프로필을 줄이기 위한
            과정이에요.
            <br />
            서로 안심하고 호감을 보낼 수 있도록.
          </div>
          <ProfilePreview profile={profile} />
          <button className="btn full" disabled={!verified} onClick={() => onStep(3)}>
            {verified ? '인증 완료하고 계속 →' : '위 항목을 인증해 주세요'}
          </button>
          <p className="footnote">목업이라 누르면 바로 인증돼요.</p>
        </>
      )}
      {step === 3 && (
        <>
          <h2 className="onboard-hero">가치관 O/X</h2>
          <p className="onboard-lead">8문항이면 충분해요. 답할수록 추천이 정확해져요.</p>
          <div className="ox">
            <div className="ox-top">
              <span className="cat">{q.c}</span>
              <b>
                {String(questionIndex + 1).padStart(2, '0')}
                <span> / 08</span>
              </b>
            </div>
            <p className="ox-q">{q.t}</p>
            <div className="progress">
              <i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
            </div>
          </div>
          <div className="ox-actions">
            <button className="btn secondary" onClick={() => answer(false)}>
              ✕ 아니요 <b>false</b>
            </button>
            <button className="btn" onClick={() => answer(true)}>
              ○ 네 <b>true</b>
            </button>
          </div>
          <button className="skip" onClick={() => answer(null)}>
            잘 모르겠어요 · 건너뛰기
          </button>
        </>
      )}
      {step === 4 && (
        <>
          <h2 className="onboard-hero">누구를 만나고 싶나요?</h2>
          <p className="onboard-lead">언제든 설정에서 바꿀 수 있어요.</p>
          <Option
            symbol="⌨"
            title="개발자"
            description="일의 언어가 통하는 사람"
            selected={profile.pref === 'dev'}
            onClick={() => update({ pref: 'dev' })}
          />
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
            description="성향과 마음의 결이 더 중요해요"
            selected={profile.pref === 'all'}
            onClick={() => update({ pref: 'all' })}
          />
          <label className="formlabel" htmlFor="relationship">
            연애 가치관
          </label>
          <select
            id="relationship"
            value={profile.rel}
            onChange={(e) => update({ rel: e.target.value })}
          >
            <option>진지한 관계를 원해요</option>
            <option>천천히 알아가고 싶어요</option>
          </select>
          <label className="formlabel" htmlFor="schedule">
            편한 만남 시간
          </label>
          <select
            id="schedule"
            value={profile.time}
            onChange={(e) => update({ time: e.target.value })}
          >
            <option>평일 저녁</option>
            <option>주말 오후</option>
            <option>유연하게 만나요</option>
          </select>
          <ProfilePreview profile={profile} />
          <button className="btn full" disabled={!profile.pref} onClick={() => onStep(5)}>
            프로필 완성하기 →
          </button>
        </>
      )}
      {step === 5 && (
        <>
          <p className="eyebrow">// build complete</p>
          <h2 className="onboard-hero">프로필이 만들어졌어요.</h2>
          <p className="onboard-lead">이제 오늘의 추천 5명을 만나볼 차례예요.</p>
          <ProfilePreview profile={profile} complete />
          <button className="btn full" onClick={onEnter}>
            오늘의 추천 5명 보기 →
          </button>
          <p className="tip">가치관 답변은 마이에서 언제든 다시 할 수 있어요.</p>
        </>
      )}
    </>
  );
};
export default Signup;
