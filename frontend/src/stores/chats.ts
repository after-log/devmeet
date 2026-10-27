import type { ChatRoom } from '@/types/chats';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mockChats } from '@/data/chats';
import { profiles } from '@/data/profiles';

interface ChatsState {
  rooms: ChatRoom[];
  startChat: (profileId: string) => void;
  markRead: (profileId: string) => void;
  sendMessage: (profileId: string, text: string) => void;
  disconnect: (profileId: string) => void;
}

export const useChatsStore = create<ChatsState>()(
  persist(
    (set) => ({
      rooms: mockChats,
      startChat: (profileId) => {
        const profile = profiles.find((profile) => profile.initial === profileId);
        if (!profile) return;
        set((state) => {
          if (state.rooms.some((room) => room.profileId === profileId)) return state;
          return {
            rooms: [
              ...state.rooms,
              {
                profileId,
                matchedAt: new Date().toISOString(),
                interests: [profile.afterWork, ...profile.tags.slice(1)],
                starter: `${profile.afterWork} 좋아하신다고 봤어요. 요즘 어떻게 즐기고 계세요?`,
                unread: 0,
                messages: [],
              },
            ],
          };
        });
      },
      markRead: (profileId) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.profileId === profileId && room.unread > 0 ? { ...room, unread: 0 } : room,
          ),
        })),
      sendMessage: (profileId, text) => {
        const trimmed = text.trim();
        if (!trimmed || trimmed.length > 1000) return;
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.profileId === profileId
              ? {
                  ...room,
                  messages: [
                    ...room.messages,
                    {
                      id: crypto.randomUUID(),
                      sender: 'me',
                      text: trimmed,
                      sentAt: new Date().toISOString(),
                    },
                  ],
                }
              : room,
          ),
        }));
      },
      disconnect: (profileId) =>
        set((state) => ({ rooms: state.rooms.filter((room) => room.profileId !== profileId) })),
    }),
    {
      name: 'devmeet.mock-chats',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ rooms: state.rooms }),
    },
  ),
);
