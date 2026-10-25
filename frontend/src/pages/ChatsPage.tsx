import { useNavigate } from 'react-router-dom';
import { useApp } from '../stores/app';
import { Empty, PersonRow } from '../components/PersonCard';

const ChatsPage = () => {
  const navigate = useNavigate();
  const matches = useApp((s) => s.connections.matches);
  return (
    <>
      <p className="eyebrow">// messages</p>
      <h2>닿은 마음, 첫 인사.</h2>
      <p className="intro">서로 좋아요를 보낸 인연과 대화해요.</p>
      {matches.length ? (
        matches.map((p) => (
          <PersonRow
            key={p.id}
            person={p}
            note="상호 좋아요로 열린 대화"
            end={<time>open</time>}
            onClick={() => navigate(`/chat/${p.id}`)}
          />
        ))
      ) : (
        <Empty
          mark="{ hi }"
          title="아직 열린 대화가 없어요"
          action={
            <button className="btn full" onClick={() => navigate('/today')}>
              인연 만나러 가기
            </button>
          }
        >
          서로의 마음이 닿으면
          <br />
          이곳에서 이야기할 수 있어요.
        </Empty>
      )}
    </>
  );
};
export default ChatsPage;
