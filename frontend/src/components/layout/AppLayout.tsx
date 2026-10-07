import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDevmeetStore } from '../../stores/devmeet';
import { useProfileActions } from '../../hooks/useProfileActions';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import AppDialogs from '../dialogs/AppDialogs';
import { Toaster } from '../ui/sonner';

const AppLayout = () => {
  const { replay } = useProfileActions();
  const step = useDevmeetStore((s) => s.step);
  const setModal = useDevmeetStore((s) => s.setModal);
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, step]);
  useEffect(() => {
    setModal(null);
  }, [pathname, setModal]);
  return (
    <>
      <div className="mx-auto max-w-[480px] min-[650px]:py-[35px]">
        <div className="min-h-dvh border-x border-[#303136] bg-canvas pb-[94px] max-[480px]:border-0 min-[650px]:min-h-[calc(100dvh-70px)] min-[650px]:overflow-hidden min-[650px]:rounded-xl min-[650px]:border min-[650px]:border-[#383b42]">
          <AppHeader onReplay={replay} />
          <main className="px-6 pt-7 pb-6 max-[480px]:px-5 max-[480px]:py-[23px] max-[360px]:px-[15px]">
            <Outlet />
          </main>
          {pathname !== '/signup' && <BottomNav />}
        </div>
      </div>
      <AppDialogs />
      <Toaster />
    </>
  );
};
export default AppLayout;
