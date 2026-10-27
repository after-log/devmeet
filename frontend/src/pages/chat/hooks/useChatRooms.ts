import { useEffect, useState } from 'react';
import { useApp } from '@/stores/app';
import { chatKey, useChatsStore } from '@/stores/chats';
import { OPENERS } from '@/data/options';
import type { ChatRoom } from '@/types/chats';

export const useChatRooms = (profileId?: string) => {
  const { connections, demo, user, demoMessages } = useApp();
  const { messages, readAt, loadMessages } = useChatsStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!demo && connections.matches.length > 0);

  useEffect(() => {
    let active = true;
    setError('');
    const targets = connections.matches.filter((p) => !profileId || p.id === profileId);
    if (demo || !targets.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void Promise.all(targets.map((p) => loadMessages(p.id)))
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [connections.matches, demo, user?.id, profileId, loadMessages]);

  const ownerId = demo ? 'demo' : (user?.id ?? '');
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
