import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { findPerson, reasonFor, useApp } from '../stores/app';
import { CodeLines, personLines } from '@/components/PersonCard';
import { publicValueAnswers } from '@/lib/value-answers';

const PersonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { people, liked, remaining, like, demo, user, openSheet, connections } = useApp();
  const p = findPerson(id);
  if (!p) return <Navigate to="/today" replace />;
  const inToday = people.some((x) => x.id === p.id);
  const matched = connections.matches.some((x) => x.id === p.id);
  const sent = liked.includes(p.id) || connections.sent.some((x) => x.id === p.id);
  const dev = (user?.profile?.role ?? 'developer') === 'developer';
  const rows: [string, string][] = [
    ['만남', p.meeting],
    ['연락', p.contact],
    ['키', `${p.height}cm`],
    ['학력', p.education],
    ['흡연', p.smoking || '미입력'],
    ['음주', p.drinking || '미입력'],
    ['종교', p.religion || '미입력'],
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <button className="back" onClick={() => navigate(-1)}>
          ← 뒤로
        </button>
        <button
          className="icon !ml-0"
          aria-label="프로필 메뉴"
          onClick={() => openSheet({ kind: 'safety', id: p.id })}
        >
          ⋯
        </button>
      </div>
      <article className="profile">
        <div className="file-tab">
          <span className="file-icon">ts</span>
          {p.name}.profile.ts<span className="tab-end">{demo ? 'demo' : '•'}</span>
        </div>
        <img className="detail-photo" src={p.photo} alt={`${p.name} 프로필 사진`} />
        <div className="profile-heading">
          <div>
            <p className="section-comment !mb-1">// {p.location}</p>
            <div className="profile-name">
              {p.name}
              <span>{p.age}</span>
            </div>
            <p>{p.job}</p>
          </div>
          <span className="tag">
            {demo
              ? '가상 프로필'
              : p.photoStatus === 'APPROVED'
                ? p.githubVerified
                  ? 'GitHub 연결 · 사진 검수 완료'
                  : '사진 검수 완료'
                : '검수 중'}
          </span>
        </div>
        <CodeLines lines={personLines(p, p.id)} />
        <div className="profile-body">
          <p className="section-comment">// about me</p>
          <p className="bio whitespace-pre-wrap">{p.intro}</p>
          <div className="reason">
            <div className="reason-top">
              <span>함께 맞는 점</span>
            </div>
            <p>{reasonFor(p)}</p>
          </div>
          <p className="section-comment">// rhythm</p>
          {publicValueAnswers(p.valueAnswers ?? {}).map((answer) => (
            <div className="mb-5" key={answer.id}>
              <p className="mb-1 text-xs text-fg-3">{answer.text}</p>
              <p className="m-0 text-sm">{answer.choice}</p>
            </div>
          ))}
          {rows.map(([k, v]) => (
            <div className="info-row" key={k}>
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
          {p.tags.length > 0 && (
            <div className="chips mt-4">
              {p.tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      </article>
      {matched ? (
        <button className="btn full" onClick={() => navigate(`/chat/${p.id}`)}>
          대화하기 →
        </button>
      ) : (
        <button
          className="btn full"
          disabled={sent || !inToday || remaining <= 0}
          onClick={async () => {
            try {
              if (await like(p)) navigate(`/match/${p.id}`);
              else toast('좋아요를 보냈어요. 서로의 마음이 닿으면 알려드려요.');
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        >
          {sent ? '✓ 보냈어요' : dev ? '♡ LGTM! · 좋아요 보내기' : '♡ 좋아요 보내기'}
        </button>
      )}
      {!inToday && !sent && !matched && (
        <p className="footnote">오늘의 추천에 포함된 사람에게만 좋아요를 보낼 수 있어요.</p>
      )}
    </>
  );
};
export default PersonPage;
