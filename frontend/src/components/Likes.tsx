import { profiles } from '../data/profiles';
import type { Profile } from '../types';
const Likes = ({
  likes,
  matched,
  onProfile,
  onDiscover,
}: {
  likes: string[];
  matched: boolean;
  onProfile: (profile: Profile) => void;
  onDiscover: () => void;
}) => {
  return (
    <>
      <p className="eyebrow">// likes</p>
      <h2>보낸 호감</h2>
      <p className="intro">내가 보낸 호감 {likes.length}</p>
      {likes.length ? (
        likes.map((id) => {
          const p = profiles.find((p) => p.initial === id)!;
          return (
            <button
              className="listrow"
              key={id}
              onClick={() => {
                onProfile(p);
              }}
            >
              <span className="small-avatar">{p.initial}</span>
              <span>
                <strong>
                  {p.name}, {p.age}
                </strong>
                <small>
                  {p.job} ·{' '}
                  {id === 'MJ' && matched
                    ? '서로 호감을 보냈어요'
                    : '상대의 답변을 기다리고 있어요'}
                </small>
              </span>
              <time>♡</time>
            </button>
          );
        })
      ) : (
        <div className="empty">
          <div className="big">♡</div>
          <h3>작은 용기로 시작해요</h3>
          <p>마음이 가는 사람에게 호감을 보내보세요.</p>
          <button className="btn full" onClick={onDiscover}>
            오늘의 추천 보기
          </button>
        </div>
      )}
    </>
  );
};
export default Likes;
