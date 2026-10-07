import { useDevmeetStore, selectProfiles } from '../stores/devmeet';
import { useShallow } from 'zustand/react/shallow';
import Discover from '../components/Discover';

const DiscoverPage = () => {
  const { index, setIndex, filter, setFilter, likes, like, settings } = useDevmeetStore(
    useShallow((s) => ({
      index: s.index,
      setIndex: s.setIndex,
      filter: s.filter,
      setFilter: s.setFilter,
      likes: s.likes,
      like: s.like,
      settings: s.settings,
    })),
  );
  const visible = selectProfiles(filter);
  const current = visible[index];
  return (
    <Discover
      profiles={visible}
      index={index}
      filter={filter}
      liked={!!current && likes.includes(current.initial)}
      onFilter={(next) => {
        setFilter(next);
        setIndex(0);
      }}
      onSettings={settings}
      onSkip={() => setIndex((previous) => previous + 1)}
      onLike={like}
      onRestart={() => setIndex(0)}
    />
  );
};
export default DiscoverPage;
