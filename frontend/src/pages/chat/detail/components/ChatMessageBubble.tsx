import type { ChatMessage } from '@/types/chats';
import { chatTime } from '@/data/chats';
import type { Person } from '@/types';
import { Avatar } from '@/components/PersonCard';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  profile: Pick<Person, 'name' | 'photo'>;
}

const ChatMessageBubble = ({ message, profile }: ChatMessageBubbleProps) => {
  const mine = message.sender === 'me';

  return (
    <div className={`chat-message ${mine ? 'is-mine' : ''}`}>
      {!mine && <Avatar person={profile} size={28} />}
      <div className="max-w-[78%] min-w-0">
        {!mine && <p className="mt-0 mb-1 text-[10px] text-fg-4">{profile.name}</p>}
        <div
          className={`chat-bubble ${mine ? 'bg-mine text-mine-fg' : 'border border-line bg-surface text-fg-2'}`}
        >
          {message.text}
        </div>
        <time
          className={`mt-1 block text-[9px] text-fg-4 ${mine ? 'text-right' : ''}`}
          dateTime={message.sentAt}
        >
          {mine && <span className="mr-1">나 ·</span>}
          {chatTime(message.sentAt)}
        </time>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
