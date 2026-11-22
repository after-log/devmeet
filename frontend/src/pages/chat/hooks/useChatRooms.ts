import { useQueries } from '@tanstack/react-query';
import { messagesQuery } from '@/lib/member-queries';
import { useEffect } from 'react';
import { useApp } from '@/stores/app';
import { chatKey, useChatsStore } from '@/stores/chats';
import { OPENERS } from '@/data/options';
import type { ChatRoom } from '@/types/chats';

export const useChatRooms = (profileId?: string) => {
  const { connections, demo, user, demoMessages } = useApp();
  const { messages, readAt, receiveLatest } = useChatsStore();
  const ownerId = demo ? 'demo' : (user?.id ?? '');
  const targets = connections.matches.filter((person) => !profileId || person.id === profileId);
  const queries = useQueries({
    queries: targets.map((person) => ({
      ...messagesQuery(ownerId, person.id),
      enabled: !demo && !!user,
      refetchInterval: 30_000,
    })),
  });
  const loading = !demo && queries.some((query) => query.isPending);
  const error = queries.find((query) => query.error)?.error?.message ?? '';
  const revision = queries
    .map((query, index) => `${targets[index].id}:${query.dataUpdatedAt}`)
    .join('|');
  // SSE and paginated history merge by message id into the existing chat projection.
  useEffect(() => {
    queries.forEach((query, index) => {
      if (query.data) receiveLatest(ownerId, targets[index].id, query.data);
    });
  }, [ownerId, receiveLatest, revision]);

  const rooms: ChatRoom[] = connections.matches.map((p) => {
    const key = chatKey(ownerId, p.id);
    const list = demo ? (demoMessages[p.id] ?? []) : (messages[key] ?? []);
    return {
      profileId: p.id,
      interests: p.tags,
      starter: OPENERS[0],
      unread: list.filter(
        (m) => m.sender !== user?.id && m.sender !== 'demo-me' && m.created > (readAt[key] ?? 0),
      ).length,
      messages: list.map((m) => ({
        id: m.id,
        sender: m.sender === user?.id || m.sender === 'demo-me' ? 'me' : 'them',
        text: m.text,
        sentAt: new Date(m.created).toISOString(),
      })),
    };
  });
  return { rooms, profiles: connections.matches, error, loading };
};
