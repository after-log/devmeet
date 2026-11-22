import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouteTyping } from '@/lib/typewriter';
import { useApp } from '../../stores/app';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import AppSheets from '@/components/AppSheets';
import { Toaster } from '@/components/ui/sonner';
import { applyTheme, getTheme } from '../../lib/theme';
import { useMemberSession } from '@/hooks/queries/useMemberSession';
import { useMemberEvents } from '@/hooks/queries/useMemberEvents';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { PwaInstallBanner } from '@/components/PwaInstall';
import PwaUpdate from '@/components/PwaUpdate';

const TABS = ['/today', '/likes', '/chat', '/me'];

const AppLayout = () => {
  const { reconnect } = useMemberSession();
  const navigate = useNavigate();
  const installState = usePwaInstall();
  const { booted, demo, error, exitDemo, step, openSheet, refresh } = useApp();
  const { pathname } = useLocation();
  // 라벨 → 제목 → 본문 타이핑. 상세 화면은 사람과 상관없이 한 화면으로 보고, 온보딩은 단계마다 따로 센다
  const mainRef = useRef<HTMLElement>(null);
  const getMain = useCallback(() => mainRef.current, []);
  const typingKey =
    pathname.replace(/^\/(chat|people|match|likes)\/[^/]+/, '/$1/:id') +
    (pathname === '/onboarding' ? `#${step}` : '');
  useRouteTyping(typingKey, booted, getMain);
  const isChatDetail = /^\/chat\/[^/]+\/?$/.test(pathname);
  const isValuesPage = pathname === '/me/values';
  const [theme, setTheme] = useState(getTheme);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(next);
  };
  useMemberEvents();
  useEffect(() => {
    window.scrollTo(0, 0);
    openSheet(null);
    // 탭으로 돌아올 때마다 추천·좋아요·매칭을 다시 불러온다
    if (TABS.includes(pathname)) void refresh();
  }, [pathname, step, openSheet, refresh]);
  return (
    <>
      <div className="mx-auto max-w-120 min-[650px]:pt-8.75">
        <div
          className={`min-h-dvh border-x border-line bg-canvas max-[480px]:border-0 min-[650px]:min-h-[calc(100dvh-35px)] min-[650px]:rounded-t-xl min-[650px]:border min-[650px]:border-b-0 min-[650px]:border-line ${isValuesPage ? 'min-[650px]:overflow-clip' : 'min-[650px]:overflow-hidden'} ${isChatDetail ? 'chat-detail-layout' : 'pb-23.5'}`}
        >
          <AppHeader theme={theme} onToggleTheme={toggleTheme} />
          {(pathname === '/' || TABS.includes(pathname)) && (
            <PwaInstallBanner state={installState} />
          )}
          {demo && (
            <div className="demo-banner">
              <span>// 둘러보기 · 가상 인물 · 실제 전송 안 됨</span>
              <button
                onClick={() => {
                  exitDemo();
                  navigate('/');
                }}
              >
                종료
              </button>
            </div>
          )}
          <main
            ref={mainRef}
            className={
              isChatDetail
                ? 'chat-detail-main'
                : 'px-6 pt-7 pb-6 max-[480px]:px-5 max-[480px]:py-5.75 max-[360px]:px-3.75'
            }
          >
            {error && !demo && (
              <div role="alert" className="mb-5 rounded-lg border border-sub p-3 text-xs text-sub">
                {error}
                <button className="ml-3 underline" onClick={() => void reconnect()}>
                  다시 연결
                </button>
              </div>
            )}
            {booted ? (
              <Outlet />
            ) : (
              <p className="prompt flex items-center" role="status">
                loading
                <span className="pixel-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </p>
            )}
          </main>
          {TABS.some((t) => pathname === t) && <BottomNav />}
        </div>
      </div>
      <AppSheets />
      <PwaUpdate />
      <Toaster theme={theme} />
    </>
  );
};
export default AppLayout;
