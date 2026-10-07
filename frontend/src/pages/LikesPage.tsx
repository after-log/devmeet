import { useNavigate } from 'react-router-dom';
import { useDevmeetStore } from '../stores/devmeet';
import { useShallow } from 'zustand/react/shallow';
import { profiles } from '../data/profiles';
import Likes from '../components/Likes';

const LikesPage = () => {
  const { likes, matched, setFilter, setIndex } = useDevmeetStore(
    useShallow((s) => ({
      likes: s.likes,
      matched: s.matched,
      setFilter: s.setFilter,
      setIndex: s.setIndex,
    })),
  );
  const navigate = useNavigate();
  return (
    <Likes
      likes={likes}
      matched={matched}
      onProfile={(p) => {
        setFilter('all');
        setIndex(profiles.indexOf(p));
        navigate('/discover');
      }}
      onDiscover={() => navigate('/discover')}
    />
  );
};
export default LikesPage;
