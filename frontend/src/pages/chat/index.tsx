import { useNavigate } from 'react-router-dom';
import ChatList from './components/ChatList';
import { useChatRooms } from './hooks/useChatRooms';

const ChatsPage = () => {
  const { rooms, profiles, error, loading } = useChatRooms();
  const navigate = useNavigate();
  return (
    <>
      {error && (
        <p className="error" role="alert">
          메시지를 불러오지 못했어요 · {error}
        </p>
      )}
      {loading && (
        <p className="section-comment" role="status">
          대화를 불러오는 중…
        </p>
      )}
      <ChatList
        rooms={rooms}
        profiles={profiles}
        onOpen={(profileId) => navigate(`/chat/${profileId}`)}
        onDiscover={() => navigate('/today')}
      />
    </>
  );
};
export default ChatsPage;
