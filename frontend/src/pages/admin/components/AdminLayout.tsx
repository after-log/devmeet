import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Check, ChevronRight, LogOut } from 'lucide-react';
import { useAdminMock } from '../hooks/useAdminMock';
import AdminSidebar from './AdminSidebar';
import { AdminAvatar, AdminSurface, IconButton } from './AdminUI';
import AdminDialogs from '../dialogs/AdminDialogs';

export default function AdminLayout() {
  const { authenticated, notice, logout } = useAdminMock();
  const { pathname } = useLocation();
  const title =
    (
      { profiles: '프로필 검수', members: '회원 관리', values: '가치관 관리' } as Record<
        string,
        string
      >
    )[pathname.split('/')[2]] ?? '대시보드';
  if (!authenticated) return <Navigate to="/admin/login" replace />;
  return (
    <AdminSurface className="flex min-h-dvh bg-[#fafafa] max-sm:block">
      <AdminSidebar />
      <div className="ml-[244px] flex min-h-dvh min-w-0 flex-1 flex-col max-[900px]:ml-[180px] max-xl:ml-[216px] max-sm:ml-0">
        <header className="flex h-[76px] items-center justify-between border-b border-[#e5e5e5] bg-white px-[43px] max-[900px]:h-[65px] max-xl:px-[25px] max-sm:h-[52px] max-sm:px-5">
          <div className="flex items-center gap-[13px] text-[13px] text-neutral-600 max-sm:gap-[7px] max-sm:text-[12px]">
            워크스페이스 <ChevronRight size={14} />
            <strong className="font-medium text-neutral-700">{title}</strong>
          </div>
          <div className="flex items-center gap-[13px] text-[13px] text-neutral-600 max-sm:gap-[7px]">
            <AdminAvatar />
            <span>관리자</span>
            <IconButton aria-label="로그아웃" onClick={logout}>
              <LogOut size={16} />
            </IconButton>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1550px] flex-1 px-[43px] pt-[39px] pb-[30px] max-xl:px-[25px] max-xl:pt-[30px] max-sm:px-[18px] max-sm:py-[25px]">
          <Outlet />
        </main>
      </div>
      <AdminDialogs />
      {notice && (
        <div
          className="fixed bottom-7 left-[calc(50%+100px)] z-90 flex max-w-[calc(100%-30px)] -translate-x-1/2 items-center gap-2.5 rounded-[9px] border border-[#525252] bg-[#262626] px-5 py-[13px] text-sm text-white shadow-lg max-sm:left-1/2 max-sm:w-max max-sm:text-[13px]"
          role="status"
        >
          <Check size={17} className="shrink-0 text-emerald-300" />
          {notice}
        </div>
      )}
    </AdminSurface>
  );
}
