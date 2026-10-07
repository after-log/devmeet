import { NavLink } from 'react-router-dom';
const tabs = [
  {
    page: 'discover',
    label: '발견',
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
    label: '호감',
    icon: <path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 1 10 8 15 7-5 12-11 8-15Z" />,
  },
  {
    page: 'chat',
    label: '대화',
    icon: <path d="M21 11a9 9 0 0 1-9 9H4l-2 2V11a9 9 0 0 1 19 0Z" />,
  },
  {
    page: 'me',
    label: '마이',
    icon: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
  },
] as const;
const BottomNav = () => (
  <nav className="fixed bottom-0 z-5 flex w-[478px] max-w-full border-t border-[#3a3c41] bg-[#242529f5] px-2 pt-[11px] pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-[15px] max-[480px]:w-full">
    {tabs.map((tab) => (
      <NavLink
        key={tab.page}
        to={`/${tab.page}`}
        className={({ isActive }) =>
          `flex min-h-[42px] flex-1 flex-col items-center justify-center gap-[6px] text-[11px] ${isActive ? 'text-blue' : 'text-[#797f8b]'}`
        }
        aria-label={tab.label}
      >
        <svg className="size-[19px] fill-none stroke-current stroke-[1.6]" viewBox="0 0 24 24">
          {tab.icon}
        </svg>
        {tab.label}
      </NavLink>
    ))}
  </nav>
);
export default BottomNav;
