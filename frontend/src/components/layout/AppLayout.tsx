import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApp } from '../../stores/app';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import AppSheets from '@/components/AppSheets';
import { Toaster } from '@/components/ui/sonner';
import { applyTheme, getTheme } from '../../lib/theme';
import { useChatsStore } from '@/stores/chats';

const TABS = ['/today', '/likes', '/chat', '/me'];

const AppLayout = () => {
  const navigate = useNavigate();
  const { booted, boot, demo, user, error, exitDemo, step, openSheet, refresh } = useApp();
  const { pathname } = useLocation();
  const isChatDetail = /^\/chat\/[^/]+\/?$/.test(pathname);
  const isValuesPage = pathname === '/me/values';
  const [theme, setTheme] = useState(getTheme);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(next);
  };
  useEffect(() => {
    void boot();
  }, [boot]);
  useEffect(() => {
    if (demo || !user) return;
    const events = new EventSource('/api/events');
    const refreshAll = () => void refresh();
    const message = (event: MessageEvent) => {
      const { peerId } = JSON.parse(event.data);
      void useChatsStore
        .getState()
        .loadMessages(peerId)
        .catch(() => void refresh());
    };
    ['like', 'match', 'connections', 'profile'].forEach((kind) =>
      events.addEventListener(kind, refreshAll),
    );
    events.addEventListener('message', message);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh();
        useApp.getState().connections.matches.forEach(
          (p) =>
            void useChatsStore
              .getState()
              .loadMessages(p.id)
              .catch(() => undefined),
        );
      }
    }, 30_000);
    return () => {
      events.close();
      window.clearInterval(interval);
    };
  }, [demo, user?.id, refresh]);
  useEffect(() => {
    window.scrollTo(0, 0);
    openSheet(null);
    // 탭으로 돌아올 때마다 추천·좋아요·매칭을 다시 불러온다
    if (TABS.includes(pathname)) void refresh();
  }, [pathname, step, openSheet, refresh]);
  return (
    <>
      <div className="mx-auto max-w-[480px] min-[650px]:py-[35px]">
        <div
          className={`min-h-dvh border-x border-line bg-canvas max-[480px]:border-0 min-[650px]:min-h-[calc(100dvh-70px)] min-[650px]:rounded-xl min-[650px]:border min-[650px]:border-line ${isValuesPage ? 'min-[650px]:overflow-clip' : 'min-[650px]:overflow-hidden'} ${isChatDetail ? 'chat-detail-layout' : 'pb-[94px]'}`}
        >
          <AppHeader theme={theme} onToggleTheme={toggleTheme} />
          {demo && (
            <div className="demo-banner">
              <span>// demo · 가상 인물 · 실제 전송 안 됨</span>
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
            className={
              isChatDetail
                ? 'chat-detail-main'
                : 'px-6 pt-7 pb-6 max-[480px]:px-5 max-[480px]:py-[23px] max-[360px]:px-[15px]'
            }
          >
            {error && !demo && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-orange p-3 text-xs text-orange"
              >
                {error}
                <button className="ml-3 underline" onClick={() => void boot()}>
                  다시 연결
                </button>
              </div>
            )}
            {booted ? (
              <Outlet />
            ) : (
              <p className="prompt">
                loading
                <i className="cursor" />
              </p>
            )}
          </main>
          {TABS.some((t) => pathname === t) && <BottomNav />}
        </div>
      </div>
      <AppSheets />
      <Toaster theme={theme} />
    </>
  );
};
export default AppLayout;
