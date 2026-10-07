import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useDevmeetStore } from '../stores/devmeet';
import { useShallow } from 'zustand/react/shallow';
import ChatThread from '../components/ChatThread';

const ChatPage = () => {
  const { profileId } = useParams();
  const { matched, messages, setMessages, setModal } = useDevmeetStore(
    useShallow((s) => ({
      matched: s.matched,
      messages: s.messages,
      setMessages: s.setMessages,
      setModal: s.setModal,
    })),
  );
  const navigate = useNavigate();
  if (profileId !== 'MJ' || !matched) return <Navigate to="/chat" replace />;
  return (
    <ChatThread
      messages={messages}
      onBack={() => navigate('/chat')}
      onSend={(text) => setMessages((previous) => [...previous, text])}
      onSafety={() => setModal('safety')}
    />
  );
};
export default ChatPage;
