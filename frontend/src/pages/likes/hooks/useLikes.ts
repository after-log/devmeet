import { useLikesStore } from '@/stores/likes';
import { useDevmeetStore } from '@/stores/devmeet';
import type { LikeEntry } from '@/types/likes';

export const useLikes = () => {
  const entries = useLikesStore((s) => s.entries);
  const sentIds = useDevmeetStore((s) => s.likes);
  const additional: LikeEntry[] = sentIds
    .filter((id) => !entries.some((entry) => entry.profileId === id && entry.direction === 'sent'))
    .map((profileId) => ({ profileId, direction: 'sent', likedAt: null }));
  return [...additional, ...entries];
};
