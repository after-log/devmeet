import { useEffect } from 'react';
import { useApp } from '@/stores/app';
import { useChatsStore } from '@/stores/chats';

export function useMemberEvents() {
  const { demo, user, refresh } = useApp();
  useEffect(() => {
    if (demo || !user) return;
    const events = new EventSource('/api/events');
    const refreshAll = () => void refresh();
    const message = (event: MessageEvent) => {
      const { peerId } = JSON.parse(event.data);
      void useChatsStore
        .getState()
        .loadMessages(peerId)
        .catch(() => void refresh());
    };
    ['like', 'match', 'connections', 'profile'].forEach((kind) =>
      events.addEventListener(kind, refreshAll),
    );
    events.addEventListener('message', message);
    return () => {
      events.close();
    };
  }, [demo, user?.id, refresh]);
}
