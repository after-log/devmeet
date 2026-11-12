import { Link, NavLink } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ClipboardCheck,
  LayoutDashboard,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminMock } from '../hooks/useAdminMock';

const menu = [
  { path: '', label: '대시보드', icon: LayoutDashboard },
  { path: '/profiles', label: '프로필 검수', icon: ClipboardCheck },
  { path: '/members', label: '회원 관리', icon: Users },
  { path: '/values', label: '가치관 관리', icon: SlidersHorizontal },
];
export default function AdminSidebar() {
  const { members } = useAdminMock();
  const pending = members.filter((m) => m.review === 'PENDING').length;
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col border-r border-[#e5e5e5] bg-white px-[18px] pt-[31px] max-[900px]:w-[180px] max-xl:w-[216px] max-xl:px-3 max-sm:sticky max-sm:top-0 max-sm:w-full max-sm:px-[15px] max-sm:py-3 max-sm:shadow-sm">
      <Link
        className="flex items-center px-[15px] font-mono text-[28px] font-bold tracking-[-1.9px] text-[#262626] max-[900px]:px-2.5 max-[900px]:text-2xl max-sm:text-[22px]"
        to="/admin"
      >
        devmeet<span className="text-[#262626]">.</span>
        <small className="mt-[7px] ml-3 rounded bg-[#f5f5f5] px-1.5 py-[3px] font-mono text-[9px] font-semibold tracking-[1.2px] text-[#737373] max-[900px]:ml-[7px] max-[900px]:text-[8px]">
          ADMIN
        </small>
      </Link>
      <nav className="mt-8 grid gap-1.5 max-sm:mt-3 max-sm:flex max-sm:gap-[5px]">
        {menu.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={`/admin${path}`}
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-[15px] py-3 font-medium max-[900px]:px-[11px] max-[900px]:text-xs max-sm:flex-1 max-sm:justify-center max-sm:gap-[5px] max-sm:px-[5px] max-sm:py-[9px] max-sm:text-[10px] max-sm:whitespace-nowrap',
                isActive
                  ? 'bg-[#f5f5f5] font-semibold text-[#262626]'
                  : 'text-[#737373] hover:bg-[#fafafa]',
              )
            }
          >
            <Icon size={19} className="max-sm:size-3.5" />
            <span>{label}</span>
            {path === '/profiles' && pending > 0 && (
              <b className="ml-auto min-w-[23px] rounded-[5px] bg-[#e5e5e5] text-center text-[10px] max-sm:ml-0 max-sm:min-w-[15px] max-sm:text-[8px]">
                {pending}
              </b>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-[30px] max-sm:hidden">
        <Link
          className="mb-[13px] flex items-center gap-2 px-4 py-[11px] text-[11px] text-[#a3a3a3]"
          to="/"
        >
          <ArrowDownLeft size={16} /> 서비스 바로가기 <ArrowRight size={15} className="ml-auto" />
        </Link>
      </div>
    </aside>
  );
}
