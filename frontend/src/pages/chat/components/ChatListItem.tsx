import { Check } from 'lucide-react';
import { chatPreviewTime, lastActivity, type ChatRoom } from '../../../data/chats';
import type { Profile } from '../../../types';

interface ChatListItemProps {
  room: ChatRoom;
  profile: Profile;
  onOpen: (profileId: string) => void;
}

const ChatListItem = ({ room, profile, onOpen }: ChatListItemProps) => {
  const last = room.messages.at(-1);

  return (
    <button className="chat-row" onClick={() => onOpen(room.profileId)}>
      <span className="small-avatar">{profile.initial}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {profile.name}
          <Check size={12} className="text-green" aria-label="인증 완료" />
          <span className="truncate text-[10px] font-normal text-fg-4">{profile.job}</span>
        </span>
        <span
          className={`mt-1.5 block truncate text-xs ${room.unread ? 'text-fg-2' : 'text-fg-4'}`}
        >
          {last
            ? `${last.sender === 'me' ? '나: ' : ''}${last.text}`
            : '마음이 통했어요. 첫 인사를 건네보세요.'}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-2">
        <time className="font-mono text-[10px] text-fg-4" dateTime={lastActivity(room)}>
          {chatPreviewTime(lastActivity(room))}
        </time>
        {room.unread > 0 ? (
          <span className="chat-unread" aria-label={`안 읽은 메시지 ${room.unread}개`}>
            {room.unread}
          </span>
        ) : !last ? (
          <span className="font-mono text-[10px] text-green">NEW</span>
        ) : (
          <span className="h-[19px]" />
        )}
      </span>
    </button>
  );
};

export default ChatListItem;
