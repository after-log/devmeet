import { useNavigate } from 'react-router-dom';
import { useChatsStore } from '@/stores/chats';
import { useLikes } from './hooks/useLikes';
import Likes from './components/Likes';

const LikesPage = () => {
  const entries = useLikes();
  const rooms = useChatsStore((s) => s.rooms);
  const navigate = useNavigate();
  return (
    <Likes
      entries={entries}
      matchedIds={rooms.map((room) => room.profileId)}
      onOpen={(profileId) => navigate(`/likes/${profileId}`)}
      onDiscover={() => navigate('/discover')}
    />
  );
};
export default LikesPage;
