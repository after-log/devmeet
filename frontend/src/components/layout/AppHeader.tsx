import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../../lib/theme';
import type { ReactNode } from 'react';
const AppHeader = ({
  theme,
  onToggleTheme,
  installAction,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  installAction?: ReactNode;
}) => (
  <header className="flex h-[68px] items-center gap-3 border-b border-line px-6 max-[480px]:h-[62px] max-[480px]:px-5">
    <Link className="logo" to="/">
      devmeet<span>_</span>
    </Link>
    <span className="demo max-[360px]:hidden">preview</span>
    {installAction}
    <button
      className="icon grid place-items-center"
      aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
      onClick={onToggleTheme}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  </header>
);
export default AppHeader;
