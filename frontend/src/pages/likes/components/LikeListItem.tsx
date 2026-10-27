import { Check, ChevronRight, Heart } from 'lucide-react';
import type { Profile } from '@/types';
import type { LikeEntry } from '@/types/likes';
import { chatPreviewTime } from '@/data/chats';

interface LikeListItemProps {
  entry: LikeEntry;
  profile: Profile;
  matched: boolean;
  onOpen: (profileId: string) => void;
}

const LikeListItem = ({ entry, profile, matched, onOpen }: LikeListItemProps) => (
  <button
    className="flex w-full items-start gap-3 border-b border-line px-2 py-5 text-left transition-colors hover:bg-surface"
    onClick={() => onOpen(profile.initial)}
  >
    <span className="small-avatar">{profile.initial}</span>
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {profile.name}
        <span className="font-mono text-xs text-fg-4">{profile.age}</span>
        <Check size={12} className="text-green" aria-label="인증 완료" />
      </span>
      <span className="mt-1 block truncate text-[11px] text-fg-3">
        {profile.job} · {profile.place}
      </span>
      <span className="mt-3 flex items-center gap-1.5 text-[11px]">
        <Heart size={12} className={matched ? 'text-green' : 'text-purple'} />
        <span className={matched ? 'text-green' : 'text-fg-4'}>
          {matched
            ? '서로 마음이 통했어요'
            : entry.direction === 'received'
              ? '나에게 호감을 보냈어요'
              : '상대의 답변을 기다리고 있어요'}
        </span>
      </span>
    </span>
    <span className="flex shrink-0 flex-col items-end gap-3">
      {entry.likedAt ? (
        <time className="font-mono text-[10px] text-fg-4" dateTime={entry.likedAt}>
          {chatPreviewTime(entry.likedAt)}
        </time>
      ) : (
        <span className="text-[10px] text-fg-4">방금</span>
      )}
      <ChevronRight size={16} className="text-fg-4" />
    </span>
  </button>
);
export default LikeListItem;
