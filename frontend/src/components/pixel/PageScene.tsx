/** 화면 위쪽에 두는 픽셀 캐릭터 장면. 추천·좋아요·대화·내 정보·시작 화면마다 하나씩 쓴다. */
export type SceneName = 'discover' | 'like' | 'chat' | 'profile' | 'welcome';

const ALT: Record<SceneName, string> = {
  discover: '두 사람이 마주 서 있는 픽셀 그림',
  like: '하트를 안은 사람과 수줍게 선 사람의 픽셀 그림',
  chat: '마주 앉아 이야기를 나누는 두 사람의 픽셀 그림',
  profile: '프로필 카드 옆에 선 사람의 픽셀 그림',
  welcome: '상대에게 걸어가는 사람의 픽셀 그림',
};

const PageScene = ({ name, className = '' }: { name: SceneName; className?: string }) => (
  <figure className={`page-scene ${className}`}>
    <img src={`/scenes/${name}.png`} alt={ALT[name]} width={328} height={166} decoding="async" />
  </figure>
);

export default PageScene;
