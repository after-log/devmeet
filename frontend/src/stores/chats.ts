import type { ChatRoom } from '@/types/chats';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mockChats } from '@/data/chats';

interface ChatsState {
  rooms: ChatRoom[];
  markRead: (profileId: string) => void;
  sendMessage: (profileId: string, text: string) => void;
  disconnect: (profileId: string) => void;
}

export const useChatsStore = create<ChatsState>()(
  persist(
    (set) => ({
      rooms: mockChats,
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
