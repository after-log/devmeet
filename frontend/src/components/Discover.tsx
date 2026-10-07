import type { Preference, Profile } from '../types';
import { useDevmeetStore } from '../stores/devmeet';
export const isDeveloper = (profile: Profile) => /개발|엔지니어/.test(profile.job);
const Discover = ({
  profiles,
  index,
  filter,
  liked,
  onFilter,
  onSettings,
  onSkip,
  onLike,
  onRestart,
}: {
  profiles: Profile[];
  index: number;
  filter: Preference;
  liked: boolean;
  onFilter: (filter: Preference) => void;
  onSettings: () => void;
  onSkip: () => void;
  onLike: () => void;
  onRestart: () => void;
}) => {
  const p = profiles[index];
  const role = useDevmeetStore((s) => s.profile.role);
  const likes = useDevmeetStore((s) => s.likes);
  return (
    <>
      <div className="topline">
        <h2>
          오늘의 발견<span className="syntax">.</span>
        </h2>
        <span className="count">
          {String(Math.min(index + 1, profiles.length)).padStart(2, '0')}{' '}
          <span>/ {String(profiles.length).padStart(2, '0')}</span>
        </span>
      </div>
      <p className="intro">
        하루 3명 · 가치관 추천 2명 + 새로운 인연 1명
        <br />
        매일 오후 6시, 미오픈 카드는 이월되지 않아요.
      </p>
      <div className="filter-row">
        {role !== 'other' && (
          <button
            className={`pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => onFilter('all')}
          >
            전체
          </button>
        )}
        <button
          className={`pill ${filter === 'dev' ? 'active' : ''}`}
          onClick={() => onFilter('dev')}
        >
          개발자
        </button>
        <button className="pill filter" onClick={onSettings} aria-label="추천 조건 설정">
          필터 <span>⌘</span>
        </button>
      </div>
      {!p ? (
        <div className="empty">
          <div className="big">// end of today</div>
          <h3>오늘의 추천을 모두 봤어요</h3>
          <p>내일 새로운 인연을 소개할게요.</p>
          <button className="btn secondary full" onClick={onRestart}>
            다시 보기
          </button>
        </div>
      ) : (
        <>
          <article className="profile">
            <div className="file-tab">
              <span className="file-icon">ts</span>
              {p.initial.toLowerCase()}.profile.ts<span className="tab-end">×</span>
            </div>
            <div className="profile-heading">
              <div>
                <div className="profile-name">
                  {p.name}
                  <span>{p.age}</span>
                  <b title="인증 완료">✓</b>
                </div>
                <p>
                  {p.job} <span>· {p.place}</span>
                </p>
              </div>
              <div className="initial-box">
                {p.initial}
                <span>_</span>
              </div>
            </div>
            <div className="code-block" aria-label="프로필 정보">
              {[
                <>
                  <span className="keyword">const</span>{' '}
                  <span className="variable">{p.initial.toLowerCase()}</span>
                  {' = {'}
                </>,
                <>
                  {'\u00a0 stack: ['}
                  <span className="string">{JSON.stringify(p.tags[0])}</span>
                  {['Java', 'React'].includes(p.tags[0]) && (
                    <>
                      , <span className="string">{JSON.stringify(p.tags[1])}</span>
                    </>
                  )}
                  {'],'}
                </>,
                <>
                  {'\u00a0 afterWork: '}
                  <span className="string">{JSON.stringify(p.afterWork)}</span>,
                </>,
                <>
                  {'\u00a0 lookingFor: '}
                  <span className="string">"진지한 관계"</span>,
                </>,
                <>
                  {'\u00a0 verified: '}
                  <span className="keyword">true</span>
                </>,
                <>{'};'}</>,
              ].map((line, i) => (
                <div className="code-line" key={i}>
                  <i>0{i + 1}</i>
                  <code>{line}</code>
                </div>
              ))}
            </div>
            <div className="profile-body">
              <p className="section-comment">// about me</p>
              <p className="bio">{p.bio}</p>
              <div className="reason">
                <div className="reason-top">
                  <span>함께 맞는 점</span>
                  <b>
                    {p.score}
                    <small>%</small>
                  </b>
                </div>
                <p>{p.reason}</p>
              </div>
              <div className="verified">
                <span>✓</span>
                {isDeveloper(p) ? '회사 이메일 · GitHub 인증' : '회사 이메일 인증'}
              </div>
            </div>
          </article>
          <div className="mt-[18px] grid grid-cols-[1fr_1.5fr] gap-[10px]">
            <button className="btn secondary" onClick={onSkip}>
              건너뛰기 <span>→</span>
            </button>
            <button className="btn" onClick={onLike} disabled={liked || likes.length >= 3}>
              ♡ &nbsp;{liked ? '좋아요 보냈어요' : role === 'other' ? '좋아요' : 'LGTM! · 좋아요'}
            </button>
          </div>
          <p className="footnote">서로 좋아요를 보내면 대화가 열려요. · 오늘 최대 3회</p>
        </>
      )}
    </>
  );
};
export default Discover;
