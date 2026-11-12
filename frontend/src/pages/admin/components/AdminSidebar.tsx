import { Link, NavLink } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminMock } from '../hooks/useAdminMock';
import { AdminAvatar, IconButton, OnlineDot } from './AdminUI';

const menu = [
  { path: '', label: '대시보드', icon: LayoutDashboard },
  { path: '/profiles', label: '프로필 검수', icon: ClipboardCheck },
  { path: '/members', label: '회원 관리', icon: Users },
  { path: '/values', label: '가치관 관리', icon: SlidersHorizontal },
];
export default function AdminSidebar() {
  const { members, logout } = useAdminMock();
  const pending = members.filter((m) => m.review === 'PENDING').length;
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col border-r border-[#e8eaf0] bg-white px-[18px] pt-[31px] max-[900px]:w-[180px] max-xl:w-[216px] max-xl:px-3 max-sm:sticky max-sm:top-0 max-sm:w-full max-sm:px-[15px] max-sm:py-3 max-sm:shadow-sm">
      <Link
        className="flex items-center px-[15px] font-mono text-[28px] font-bold tracking-[-1.9px] text-[#293040] max-[900px]:px-2.5 max-[900px]:text-2xl max-sm:text-[22px]"
        to="/admin"
      >
        devmeet<span className="text-[#7f65d4]">.</span>
        <small className="mt-[7px] ml-3 rounded bg-[#f2eff8] px-1.5 py-[3px] font-mono text-[9px] font-semibold tracking-[1.2px] text-[#8c859f] max-[900px]:ml-[7px] max-[900px]:text-[8px]">
          ADMIN
        </small>
      </Link>
      <div className="mx-[5px] mt-[33px] mb-[29px] flex items-center gap-2.5 rounded-[9px] border border-[#e8eaf0] px-2.5 py-[13px] max-[900px]:gap-[7px] max-[900px]:px-1.5 max-sm:hidden">
        <span className="grid size-[33px] shrink-0 place-items-center rounded-[7px] bg-[#f1eef9] text-[#8267ca] max-[900px]:w-[26px]">
          <ShieldCheck size={18} />
        </span>
        <div>
          <strong className="text-[11px] max-[900px]:text-[10px]">운영 워크스페이스</strong>
          <small className="block text-[10px] text-[#9297a4] max-[900px]:text-[8px]">
            devmeet management
          </small>
        </div>
        <span className="ml-auto max-[900px]:hidden">
          <OnlineDot />
        </span>
      </div>
      <p className="px-4 pb-3 text-[9px] font-semibold tracking-[1.6px] text-[#a2a7b4] max-sm:hidden">
        WORKSPACE
      </p>
      <nav className="grid gap-1.5 max-sm:mt-3 max-sm:flex max-sm:gap-[5px]">
        {menu.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={`/admin${path}`}
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-[15px] py-3 font-medium max-[900px]:px-[11px] max-[900px]:text-xs max-sm:flex-1 max-sm:justify-center max-sm:gap-[5px] max-sm:px-[5px] max-sm:py-[9px] max-sm:text-[10px] max-sm:whitespace-nowrap',
                isActive
                  ? 'bg-[#f0ecf9] font-semibold text-[#7857c7]'
                  : 'text-[#7a8091] hover:bg-[#f8f7fc]',
              )
            }
          >
            <Icon size={19} className="max-sm:size-3.5" />
            <span>{label}</span>
            {path === '/profiles' && pending > 0 && (
              <b className="ml-auto min-w-[23px] rounded-[5px] bg-[#e5dcf6] text-center text-[10px] max-sm:ml-0 max-sm:min-w-[15px] max-sm:text-[8px]">
                {pending}
              </b>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-[30px] max-sm:hidden">
        <div className="mx-1.5 mb-[15px] rounded-[9px] border border-[#edeaf3] bg-[#faf9fc] px-[13px] py-[15px] max-[900px]:p-2.5">
          <OnlineDot />
          <strong className="ml-2 text-[11px]">Mock 데이터 모드</strong>
          <p className="mt-[7px]! text-[10px] leading-[1.8] text-[#95909f] max-[900px]:text-[9px]">
            변경 사항은 현재 화면에만 반영됩니다.
            <br />
            새로고침하면 초기화됩니다.
          </p>
        </div>
        <Link className="flex items-center gap-2 px-4 py-[11px] text-[11px] text-[#8a8f9d]" to="/">
          <ArrowDownLeft size={16} /> 서비스 바로가기 <ArrowRight size={15} className="ml-auto" />
        </Link>
        <div className="mt-[13px] flex items-center gap-2.5 border-t border-[#eceef3] px-[9px] py-5">
          <AdminAvatar />
          <div>
            <strong>관리자</strong>
            <small className="block text-[10px] text-[#9297a4]">Administrator</small>
          </div>
          <IconButton className="ml-auto" aria-label="로그아웃" onClick={logout}>
            <LogOut size={17} />
          </IconButton>
        </div>
      </div>
    </aside>
  );
}
