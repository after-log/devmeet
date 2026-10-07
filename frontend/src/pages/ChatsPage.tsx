import { useNavigate } from 'react-router-dom';
import { useDevmeetStore } from '../stores/devmeet';
import { useShallow } from 'zustand/react/shallow';
import ChatList from '../components/ChatList';

const ChatsPage = () => {
  const { matched, messages } = useDevmeetStore(
    useShallow((s) => ({ matched: s.matched, messages: s.messages })),
  );
  const navigate = useNavigate();
  return (
    <ChatList
      matched={matched}
      messages={messages}
      onOpen={() => navigate('/chat/MJ')}
      onDiscover={() => navigate('/discover')}
    />
  );
};
export default ChatsPage;
