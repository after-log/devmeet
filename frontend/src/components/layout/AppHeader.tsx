import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../../lib/theme';
const AppHeader = ({
  onReplay,
  theme,
  onToggleTheme,
}: {
  onReplay: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}) => (
  <header className="flex h-[68px] items-center gap-3 border-b border-line px-6 max-[480px]:h-[62px] max-[480px]:px-5">
    <Link className="logo" to="/discover">
      devmeet<span>_</span>
    </Link>
    <span className="demo">preview</span>
    <button
      className="icon grid place-items-center"
      aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
      onClick={onToggleTheme}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
    <button className="icon ml-0" aria-label="온보딩 체험" onClick={onReplay}>
      ⌘
    </button>
  </header>
);
export default AppHeader;
