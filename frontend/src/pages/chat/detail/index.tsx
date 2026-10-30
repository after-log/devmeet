import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { chatKey, useChatsStore } from '@/stores/chats';
import { useApp } from '@/stores/app';
import { useChatRooms } from '../hooks/useChatRooms';
import ChatThread from './components/ChatThread';

const ChatPage = () => {
  const { profileId } = useParams();
  const { rooms, profiles, error, loading } = useChatRooms(profileId);
  const room = rooms.find((room) => room.profileId === profileId);
  const profile = profiles.find((profile) => profile.id === profileId);
  const markRead = useChatsStore((s) => s.markRead);
  const sendMessage = useChatsStore((s) => s.sendMessage);
  const loadOlder = useChatsStore((s) => s.loadOlder);
  const owner = useApp((s) => s.user?.id);
  const cursor = useChatsStore((s) =>
    owner && profileId ? s.cursors[chatKey(owner, profileId)] : null,
  );
  const openSheet = useApp((s) => s.openSheet);
  const navigate = useNavigate();

  useEffect(() => {
    if (profileId && room && !loading) markRead(profileId);
  }, [profileId, room?.messages.length, loading, markRead]);

  if (!room || !profile) return <Navigate to="/chat" replace />;
  return (
    <ChatThread
      key={profileId}
      room={room}
      profile={profile}
      loading={loading}
      error={error}
      onBack={() => navigate('/chat')}
      onSend={(text) => sendMessage(room.profileId, text)}
      hasOlder={!!cursor}
      onLoadOlder={() => loadOlder(room.profileId)}
      onSafety={() => openSheet({ kind: 'safety', id: profile.id })}
    />
  );
};
export default ChatPage;
