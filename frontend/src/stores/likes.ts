import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mockLikes } from '@/data/likes';
import type { LikeEntry } from '@/types/likes';

interface LikesState {
  entries: LikeEntry[];
  dismiss: (profileId: string) => void;
}

export const useLikesStore = create<LikesState>()(
  persist(
    (set) => ({
      entries: mockLikes,
      dismiss: (profileId) =>
        set((state) => ({
          entries: state.entries.filter(
            (entry) => entry.profileId !== profileId || entry.direction !== 'received',
          ),
        })),
    }),
    {
      name: 'devmeet.mock-likes',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);
