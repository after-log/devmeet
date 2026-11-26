import { Link, NavLink } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ClipboardCheck,
  Building2,
  LayoutDashboard,
  SlidersHorizontal,
  Sliders,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '../hooks/useAdmin';

const menu = [
  { path: '', label: '대시보드', icon: LayoutDashboard },
  { path: '/profiles', label: '프로필 검수', icon: ClipboardCheck },
  { path: '/members', label: '회원 관리', icon: Users },
  { path: '/companies', label: '기업 이메일 인증', icon: Building2 },
  { path: '/matching', label: '매칭 설정', icon: Sliders },
  { path: '/values', label: '가치관 관리', icon: SlidersHorizontal },
];
export default function AdminSidebar() {
  const { members } = useAdmin();
  const pending = members.filter((m) => m.review === 'PENDING').length;
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-61 flex-col border-r border-[#e5e5e5] bg-white px-4.5 pt-7.75 max-[900px]:w-45 max-xl:w-54 max-xl:px-3 max-sm:sticky max-sm:top-0 max-sm:w-full max-sm:px-3.75 max-sm:py-3 max-sm:shadow-sm">
      <Link
        className="flex items-center px-3.75 font-mono text-[28px] font-bold tracking-[-1.9px] text-[#262626] max-[900px]:px-2.5 max-[900px]:text-2xl max-sm:text-[22px]"
        to="/admin"
      >
        찌릿
        <small className="mt-1.75 ml-3 rounded bg-[#f5f5f5] px-1.5 py-0.75 font-mono text-[12px] font-semibold tracking-[1.2px] text-neutral-600 max-[900px]:ml-1.75 max-[900px]:text-[12px]">
          ADMIN
        </small>
      </Link>
      <nav className="mt-8 grid gap-1.5 max-sm:mt-3 max-sm:flex max-sm:gap-1.25 max-sm:overflow-x-auto">
        {menu.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={`/admin${path}`}
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3.75 py-3 font-medium max-[900px]:px-2.75 max-[900px]:text-sm max-sm:flex-1 max-sm:justify-center max-sm:gap-1.25 max-sm:px-1.25 max-sm:py-2.25 max-sm:text-[12px] max-sm:whitespace-nowrap',
                isActive
                  ? 'bg-[#f5f5f5] font-semibold text-[#262626]'
                  : 'text-neutral-600 hover:bg-[#fafafa]',
              )
            }
          >
            <Icon size={19} className="max-sm:size-3.5" />
            <span>{label}</span>
            {path === '/profiles' && pending > 0 && (
              <b className="ml-auto min-w-5.75 rounded-md bg-amber-100 text-center text-[12px] text-amber-800 max-sm:ml-0 max-sm:min-w-3.75 max-sm:text-[12px]">
                {pending}
              </b>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-7.5 max-sm:hidden">
        <Link
          className="mb-3.25 flex items-center gap-2 px-4 py-2.75 text-[13px] text-neutral-600"
          to="/"
        >
          <ArrowDownLeft size={16} /> 서비스 바로가기 <ArrowRight size={15} className="ml-auto" />
        </Link>
      </div>
    </aside>
  );
}
