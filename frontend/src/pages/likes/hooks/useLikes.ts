import { useApp } from '@/stores/app';
import type { LikeEntry } from '@/types/likes';

export const useLikes = (): LikeEntry[] => {
  const connections = useApp((s) => s.connections);
  return [
    ...connections.received.map((p) => ({
      profileId: p.id,
      direction: 'received' as const,
      likedAt: null,
    })),
    ...connections.sent.map((p) => ({
      profileId: p.id,
      direction: 'sent' as const,
      likedAt: null,
    })),
  ];
};
