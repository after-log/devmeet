import { useNavigate } from 'react-router-dom';
import { useChatsStore } from '../../stores/chats';
import ChatList from './components/ChatList';

const ChatsPage = () => {
  const rooms = useChatsStore((s) => s.rooms);
  const navigate = useNavigate();
  return (
    <ChatList
      rooms={rooms}
      onOpen={(profileId) => navigate(`/chat/${profileId}`)}
      onDiscover={() => navigate('/discover')}
    />
  );
};
export default ChatsPage;
