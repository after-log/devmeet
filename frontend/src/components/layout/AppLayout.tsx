import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDevmeetStore } from '../../stores/devmeet';
import { useProfileActions } from '../../hooks/useProfileActions';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import AppDialogs from '../dialogs/AppDialogs';
import { Toaster } from '../ui/sonner';
import { applyTheme, getTheme } from '../../lib/theme';

const AppLayout = () => {
  const { replay } = useProfileActions();
  const step = useDevmeetStore((s) => s.step);
  const setModal = useDevmeetStore((s) => s.setModal);
  const { pathname } = useLocation();
  const isChatDetail = /^\/chat\/[^/]+\/?$/.test(pathname);
  const [theme, setTheme] = useState(getTheme);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(next);
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, step]);
  useEffect(() => {
    setModal(null);
  }, [pathname, setModal]);
  return (
    <>
      <div className="mx-auto max-w-[480px] min-[650px]:py-[35px]">
        <div
          className={`min-h-dvh border-x border-line bg-canvas max-[480px]:border-0 min-[650px]:min-h-[calc(100dvh-70px)] min-[650px]:overflow-hidden min-[650px]:rounded-xl min-[650px]:border min-[650px]:border-line ${isChatDetail ? 'chat-detail-layout' : 'pb-[94px]'}`}
        >
          <AppHeader onReplay={replay} theme={theme} onToggleTheme={toggleTheme} />
          <main
            className={
              isChatDetail
                ? 'chat-detail-main'
                : 'px-6 pt-7 pb-6 max-[480px]:px-5 max-[480px]:py-[23px] max-[360px]:px-[15px]'
            }
          >
            <Outlet />
          </main>
          {pathname !== '/signup' && !isChatDetail && <BottomNav />}
        </div>
      </div>
      <AppDialogs />
      <Toaster theme={theme} />
    </>
  );
};
export default AppLayout;
