import { Link } from 'react-router-dom';
const AppHeader = ({ onReplay }: { onReplay: () => void }) => (
  <header className="flex h-[68px] items-center gap-3 border-b border-[#303136] px-6 max-[480px]:h-[62px] max-[480px]:px-5">
    <Link className="logo" to="/discover">
      devmeet<span>_</span>
    </Link>
    <span className="demo">preview</span>
    <button className="icon" aria-label="온보딩 체험" onClick={onReplay}>
      ⌘
    </button>
  </header>
);
export default AppHeader;
