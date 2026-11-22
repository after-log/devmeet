import type { CSSProperties } from 'react';

/** 투명 스프라이트의 각 행이 하나의 장면, 각 열이 하나의 동작이다. */
export type SceneName = 'discover' | 'like' | 'chat' | 'profile' | 'welcome';

const ALT: Record<SceneName, string> = {
  discover: '눈을 맞추고 손을 흔들며 인사하는 두 사람의 픽셀 그림',
  like: '서로 하트를 주고받는 두 사람의 픽셀 그림',
  chat: '마주 앉아 이야기를 나누는 두 사람의 픽셀 그림',
  profile: '프로필 카드 옆에 선 사람의 픽셀 그림',
  welcome: '다가가 하이파이브하며 반기는 두 사람의 픽셀 그림',
};

// Source atlas is 1536 × 1024. Keep the welcome heart out of the profile crop.
const CROP: Record<SceneName, { top: number; height: number }> = {
  discover: { top: 0, height: 205 },
  like: { top: 205, height: 205 },
  chat: { top: 410, height: 200 },
  profile: { top: 610, height: 190 },
  welcome: { top: 800, height: 224 },
};

const PageScene = ({ name, className = '' }: { name: SceneName; className?: string }) => {
  const { top, height } = CROP[name];
  return (
    <figure className={`page-scene ${className}`}>
      <div
        key={name}
        className="page-scene-sprite"
        role="img"
        aria-label={ALT[name]}
        style={
          {
            '--scene-row': `${(top / (1024 - height)) * 100}%`,
            '--scene-size': `${(1024 / height) * 100}%`,
            '--scene-ratio': `512 / ${height}`,
          } as CSSProperties
        }
      />
    </figure>
  );
};

export default PageScene;
