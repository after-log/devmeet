import { parseForm } from '@/validation/forms';
import { messageTextSchema } from '@/validation/community';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Message } from '@/types';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { messagesQuery } from '@/lib/member-queries';
import { useApp } from '@/stores/app';

interface ChatsState {
  messages: Record<string, Message[]>;
  readAt: Record<string, number>;
  cursors: Record<string, string | null>;
  receiveLatest: (
    owner: string,
    profileId: string,
    data: { messages: Message[]; nextCursor: string | null },
  ) => void;
  loadOlder: (profileId: string) => Promise<void>;
  loadMessages: (profileId: string) => Promise<void>;
  markRead: (profileId: string) => void;
  sendMessage: (profileId: string, text: string) => Promise<void>;
}

export const chatKey = (ownerId: string, profileId: string) => `${ownerId}:${profileId}`;

export const useChatsStore = create<ChatsState>()(
  persist(
    (set, get) => ({
      messages: {},
      readAt: {},
      cursors: {},
      receiveLatest: (owner, profileId, { messages, nextCursor }) => {
        const current = useApp.getState();
        if (
          current.demo ||
          current.user?.id !== owner ||
          !current.connections.matches.some((p) => p.id === profileId)
        )
          return;
        const key = chatKey(owner, profileId);
        set((state) => {
          const merged = new Map(messages.map((message) => [message.id, message]));
          for (const message of state.messages[key] ?? []) merged.set(message.id, message);
          return {
            cursors: {
              ...state.cursors,
              [key]: key in state.cursors ? state.cursors[key] : nextCursor,
            },
            messages: {
              ...state.messages,
              [key]: [...merged.values()].sort((a, b) => a.created - b.created),
            },
          };
        });
      },
      loadMessages: async (profileId) => {
        const { user, demo, connections } = useApp.getState();
        if (demo || !user || !connections.matches.some((p) => p.id === profileId)) return;
        const data = await queryClient.fetchQuery(messagesQuery(user.id, profileId));
        get().receiveLatest(user.id, profileId, data);
      },
      loadOlder: async (profileId) => {
        const { user, demo, connections } = useApp.getState();
        if (demo || !user || !connections.matches.some((p) => p.id === profileId)) return;
        const key = chatKey(user.id, profileId),
          cursor = get().cursors[key];
        if (!cursor) return;
        const result = await queryClient.fetchQuery(messagesQuery(user.id, profileId, cursor));
        const current = useApp.getState();
        if (
          current.demo ||
          current.user?.id !== user.id ||
          !current.connections.matches.some((p) => p.id === profileId)
        )
          return;
        set((state) => ({
          cursors: { ...state.cursors, [key]: result.nextCursor },
          messages: {
            ...state.messages,
            [key]: [
              ...new Map(
                [...result.messages, ...(state.messages[key] ?? [])].map((m) => [m.id, m]),
              ).values(),
            ].sort((a, b) => a.created - b.created),
          },
        }));
      },
      markRead: (profileId) => {
        const { user, demo } = useApp.getState();
        const ownerId = demo ? 'demo' : user?.id;
        if (ownerId)
          set((s) => ({ readAt: { ...s.readAt, [chatKey(ownerId, profileId)]: Date.now() } }));
      },
      sendMessage: async (profileId, text) => {
        const trimmed = parseForm(messageTextSchema, text);
        const { user, demo, demoSend, connections } = useApp.getState();
        if (!connections.matches.some((p) => p.id === profileId))
          throw new Error('서로 좋아요를 보낸 상대와만 대화할 수 있어요.');
        if (demo) {
          demoSend(profileId, trimmed);
          return;
        }
        if (!user) throw new Error('로그인이 필요해요.');
        const { message } = await api.send(profileId, trimmed);
        const current = useApp.getState();
        if (current.demo || current.user?.id !== user.id) return;
        const key = chatKey(user.id, profileId);
        set((s) => ({
          messages: {
            ...s.messages,
            [key]: [...(s.messages[key] ?? []).filter((m) => m.id !== message.id), message].sort(
              (a, b) => a.created - b.created,
            ),
          },
        }));
      },
    }),
    {
      name: 'devmeet.chat-read-state',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ readAt: state.readAt }),
    },
  ),
);
