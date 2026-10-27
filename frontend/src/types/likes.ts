export type LikeDirection = 'received' | 'sent';

export interface LikeEntry {
  profileId: string;
  direction: LikeDirection;
  likedAt: string | null;
}
