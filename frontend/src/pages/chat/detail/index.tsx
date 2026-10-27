import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useChatsStore } from '../../../stores/chats';
import { profiles } from '../../../data/profiles';
import ChatThread from './components/ChatThread';

const ChatPage = () => {
  const { profileId } = useParams();
  const room = useChatsStore((s) => s.rooms.find((room) => room.profileId === profileId));
  const markRead = useChatsStore((s) => s.markRead);
  const sendMessage = useChatsStore((s) => s.sendMessage);
  const disconnect = useChatsStore((s) => s.disconnect);
  const navigate = useNavigate();
  const profile = profiles.find((profile) => profile.initial === profileId);

  useEffect(() => {
    if (profileId) markRead(profileId);
  }, [profileId, markRead]);

  if (!room || !profile) return <Navigate to="/chat" replace />;
  return (
    <ChatThread
      key={profileId}
      room={room}
      profile={profile}
      onBack={() => navigate('/chat')}
      onSend={(text) => sendMessage(room.profileId, text)}
      onDisconnect={() => {
        disconnect(room.profileId);
        navigate('/chat', { replace: true });
      }}
    />
  );
};
export default ChatPage;
