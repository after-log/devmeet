import type { LikeEntry } from '@/types/likes';

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(18, 0, 0, 0);
  return date.toISOString();
};

export const mockLikes: LikeEntry[] = [
  { profileId: 'DY', direction: 'received', likedAt: daysAgo(1) },
  { profileId: 'HE', direction: 'received', likedAt: daysAgo(2) },
  { profileId: 'MJ', direction: 'sent', likedAt: daysAgo(1) },
  { profileId: 'SY', direction: 'sent', likedAt: daysAgo(2) },
];
