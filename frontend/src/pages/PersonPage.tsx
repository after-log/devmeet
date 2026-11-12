import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { findPerson, reasonFor, useApp } from '../stores/app';
import { CodeLines, personLines } from '@/components/PersonCard';
import PhotoGallery from '@/components/PhotoGallery';
import LikeButton from '@/components/LikeButton';
import { useValueCatalog } from '@/hooks/useValueCatalog';
import { publicValueAnswers } from '@/lib/value-answers';

const PersonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { people, liked, demo, user, connections } = useApp();
  const { sections } = useValueCatalog(demo);
  const questions = sections.flatMap((section) => section.questions);
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
      <article className="profile">
        <div className="file-tab">
          <span className="file-icon">ts</span>
          {p.name}.profile.ts<span className="tab-end">{demo ? 'demo' : '•'}</span>
        </div>
        <PhotoGallery photos={p.photos} photo={p.photo} name={p.name} />
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
                  ? 'GitHub 인증 완료 · 사진 검수 완료'
                  : '사진 검수 완료'
                : '검수 중'}
          </span>
        </div>
        <CodeLines lines={personLines(p)} />
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
          {publicValueAnswers(p.valueAnswers ?? {}, questions).map((answer) => (
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
        <span className="mt-6 block">
          <LikeButton
            person={p}
            disabled={sent || !inToday}
            label={dev ? '♡ LGTM! · 좋아요 보내기' : '♡ 좋아요 보내기'}
          />
        </span>
      )}
      {!inToday && !sent && !matched && (
        <p className="footnote">오늘의 추천에 포함된 사람에게만 좋아요를 보낼 수 있어요.</p>
      )}
    </>
  );
};
export default PersonPage;
