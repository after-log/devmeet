import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { findPerson, reasonFor, useApp } from '../stores/app';
import { Avatar } from '../components/PersonCard';

const MatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, draft, people, index, setIndex } = useApp();
  const p = findPerson(id);
  if (!p) return <Navigate to="/today" replace />;
  const me = user?.profile ?? { name: '나', photo: draft.photo ?? '' };
  const dev = (user?.profile?.role ?? 'developer') === 'developer';
  return (
    <div className="match">
      <p className="eyebrow">// connection established</p>
      <div className="gradient-title">{dev ? 'git merge --no-ff' : 'match = true;'}</div>
      <div className="match-pair" aria-hidden="true">
        <Avatar person={me} size={84} />
        <span className="match-link" />
        <Avatar person={p} size={84} />
      </div>
      <h2 className="onboard-hero">
        서로의 마음이
        <br />
        닿았어요.
      </h2>
      {dev && <p className="merged">Merged.</p>}
      <p className="onboard-lead">{p.name}님과 첫 인사를 건네볼까요?</p>
      <div className="panel text-left">
        <p className="section-comment">// shared rhythm</p>
        <p className="!m-0">{reasonFor(p)}</p>
      </div>
      <button className="btn full" onClick={() => navigate(`/chat/${p.id}`)}>
        첫 인사 보내기
      </button>
      <button
        className="btn secondary mt-[10px] w-full"
        onClick={() => {
          if (index < people.length - 1) setIndex(index + 1);
          navigate('/today');
        }}
      >
        추천 계속 보기
      </button>
    </div>
  );
};
export default MatchPage;
