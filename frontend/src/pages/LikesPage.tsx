import { useNavigate } from 'react-router-dom';
import { useApp } from '../stores/app';
import { Empty, PersonRow } from '../components/PersonCard';

const LikesPage = () => {
  const navigate = useNavigate();
  const { connections, people } = useApp();
  const { sent, received, matches } = connections;
  const isMatch = (id: string) => matches.some((m) => m.id === id);
  return (
    <>
      <p className="eyebrow">// likes</p>
      <h2>마음을 전한 인연</h2>
      <p className="intro">
        보낸 좋아요 {sent.length} · 받은 좋아요 {received.length}
      </p>
      <p className="section-comment">// sent</p>
      {sent.length ? (
        sent.map((p) => (
          <PersonRow
            key={p.id}
            person={p}
            note={isMatch(p.id) ? '서로 좋아요 · 대화가 열렸어요' : '상대의 답을 기다리고 있어요'}
            end={<time>{isMatch(p.id) ? 'merged' : '♡'}</time>}
            onClick={() => navigate(isMatch(p.id) ? `/chat/${p.id}` : `/people/${p.id}`)}
          />
        ))
      ) : (
        <Empty
          mark="♡"
          title="작은 용기로 시작해요"
          action={
            <button className="btn full" onClick={() => navigate('/today')}>
              오늘의 추천 보기
            </button>
          }
        >
          마음이 가는 사람에게 좋아요를 보내 보세요.
          <br />
          하루 세 번까지 보낼 수 있어요.
        </Empty>
      )}
      <p className="section-comment mt-8">// received</p>
      {received.length ? (
        received.map((p) => (
          <PersonRow
            key={p.id}
            person={p}
            note={
              isMatch(p.id)
                ? '서로 좋아요 · 대화가 열렸어요'
                : people.some((x) => x.id === p.id)
                  ? '오늘의 추천에 있어요 · 좋아요로 답할 수 있어요'
                  : '나에게 좋아요를 보냈어요'
            }
            onClick={() => navigate(isMatch(p.id) ? `/chat/${p.id}` : `/people/${p.id}`)}
          />
        ))
      ) : (
        <p className="muted text-[13px]">새로운 마음을 기다리고 있어요.</p>
      )}
      <p className="tip">
        받은 좋아요의 상대가 오늘의 추천에도 있다면 좋아요를 돌려보낼 수 있어요.
      </p>
    </>
  );
};
export default LikesPage;
