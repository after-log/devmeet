import { useNavigate } from 'react-router-dom';
import { useApp } from '@/stores/app';
import { useLikes } from './hooks/useLikes';
import Likes from './components/Likes';

const LikesPage = () => {
  const entries = useLikes();
  const connections = useApp((s) => s.connections);
  const navigate = useNavigate();
  return (
    <Likes
      entries={entries}
      profiles={[...connections.received, ...connections.sent]}
      matchedIds={connections.matches.map((p) => p.id)}
      onOpen={(profileId) => navigate(`/likes/${profileId}`)}
      onDiscover={() => navigate('/today')}
    />
  );
};
export default LikesPage;
