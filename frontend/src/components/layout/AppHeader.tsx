import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ellipsis, Moon, Sun } from 'lucide-react';
import { findPerson, useApp } from '@/stores/app';
import { Avatar } from '@/components/PersonCard';
import type { Theme } from '../../lib/theme';

const AppHeader = ({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, step, setStep, openSheet } = useApp();
  const profileRoute = ['/people/:id', '/likes/:id', '/chat/:id']
    .map((path) => matchPath(path, pathname))
    .find(Boolean);
  const person = profileRoute ? findPerson(profileRoute.params.id) : undefined;
  const isChat = !!matchPath('/chat/:id', pathname);
  const isOnboarding = pathname === '/onboarding';
  let detail: { title: string; parent: string } | undefined;

  if (matchPath('/people/:id', pathname)) detail = { title: '프로필', parent: '/today' };
  else if (matchPath('/likes/:id', pathname)) detail = { title: '호감 상세', parent: '/likes' };
  else if (isChat) detail = { title: person?.name ?? '대화', parent: '/chat' };
  else if (matchPath('/match/:id', pathname)) detail = { title: '매칭', parent: '/today' };
  else if (pathname === '/me/verification') detail = { title: '인증 관리', parent: '/me' };
  else if (pathname === '/me/verification/company')
    detail = { title: '회사 인증', parent: '/me/verification' };
  else if (pathname === '/me/verification/github')
    detail = { title: 'GitHub 인증', parent: '/me/verification' };
  else if (pathname === '/me/values') detail = { title: '나의 가치관', parent: '/me' };
  else if (pathname === '/admin') detail = { title: '운영자 관리', parent: '/me' };
  else if (isOnboarding)
    detail = {
      title: user?.profile ? '프로필 편집' : '프로필 만들기',
      parent: user?.profile ? '/me' : '/',
    };
  else if (pathname === '/auth/verify') detail = { title: '이메일 확인', parent: '/auth/login' };
  else if (matchPath('/auth/:mode', pathname)) detail = { title: '로그인', parent: '/' };

  const goBack = () => {
    if (!detail) return;
    if (isOnboarding && step > 0) setStep(step - 1);
    else if (isOnboarding) navigate(detail.parent);
    else if (typeof window.history.state?.idx === 'number' && window.history.state.idx > 0)
      navigate(-1);
    else navigate(detail.parent, { replace: true });
  };

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-line px-6 max-[480px]:h-[62px] max-[480px]:px-5">
      {detail ? (
        <>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-md text-fg-3 hover:bg-lift"
            aria-label="뒤로가기"
            onClick={goBack}
          >
            <ArrowLeft size={20} />
          </button>
          {isChat && person && <Avatar person={person} size={36} />}
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-semibold text-fg">{detail.title}</p>
            {isChat && person && (
              <p className="m-0 truncate text-[11px] text-fg-4">
                {person.job} · {person.location}
              </p>
            )}
          </div>
          {profileRoute && person && (
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-md text-fg-3 hover:bg-lift"
              aria-label={isChat ? '대화 안전 설정' : '프로필 메뉴'}
              onClick={() => openSheet({ kind: 'safety', id: person.id })}
            >
              <Ellipsis size={20} />
            </button>
          )}
        </>
      ) : (
        <>
          <Link className="logo" to="/">
            devmeet<span>_</span>
          </Link>
          <span className="demo max-[360px]:hidden">preview</span>
        </>
      )}
      <button
        className="icon grid shrink-0 place-items-center"
        aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
        onClick={onToggleTheme}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </header>
  );
};
export default AppHeader;
