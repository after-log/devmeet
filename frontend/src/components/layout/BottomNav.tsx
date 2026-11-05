import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '@/stores/app';
const tabs = [
  {
    page: 'today',
    label: '추천',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
  },
  {
    page: 'likes',
    label: '좋아요',
    icon: <path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 1 10 8 15 7-5 12-11 8-15Z" />,
  },
  {
    page: 'chat',
    label: '대화',
    icon: <path d="M21 11a9 9 0 0 1-9 9H4l-2 2V11a9 9 0 0 1 19 0Z" />,
  },
  {
    page: 'me',
    label: '내 정보',
    icon: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
  },
] as const;
/** 받은 좋아요 중 아직 좋아요 탭에서 보지 않은 것이 있으면 true. 본 목록은 회원별로 이 브라우저에 기억한다. */
const useNewLikes = () => {
  const { pathname } = useLocation();
  const userId = useApp((s) => s.user?.id);
  const received = useApp((s) => s.connections.received);
  const key = userId ? `devmeet.seenLikes.${userId}` : '';
  const ids = received.map((p) => p.id);
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
    } catch {
      return [];
    }
  };
  const [seen, setSeen] = useState<string[]>(read);
  useEffect(() => setSeen(read()), [key]);
  useEffect(() => {
    if (pathname !== '/likes' || !key) return;
    try {
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // 저장 공간이 없으면 이번 방문 동안만 숨긴다
    }
    setSeen(ids);
  }, [pathname, key, ids.join(',')]);
  return !!key && pathname !== '/likes' && ids.some((id) => !seen.includes(id));
};

const BottomNav = () => {
  const fresh = useNewLikes();
  return (
    <nav className="fixed bottom-0 z-5 flex w-[478px] max-w-full border-t border-line bg-nav px-2 pt-[11px] pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-[15px] max-[480px]:w-full">
      {tabs.map((tab) => (
        <NavLink
          key={tab.page}
          to={`/${tab.page}`}
          className={({ isActive }) =>
            `flex min-h-[42px] flex-1 flex-col items-center justify-center gap-[6px] text-[11px] ${isActive ? 'text-blue' : 'text-fg-4'}`
          }
          aria-label={tab.label}
        >
          <span className="relative">
            <svg className="size-[19px] fill-none stroke-current stroke-[1.6]" viewBox="0 0 24 24">
              {tab.icon}
            </svg>
            {tab.page === 'likes' && fresh && (
              <i className="pixel-new-dot" role="img" aria-label="새 좋아요" />
            )}
          </span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
};
export default BottomNav;
