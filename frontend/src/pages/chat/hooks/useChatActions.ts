import { mutationKeys } from '@/lib/query-keys';
import { useMutation } from '@tanstack/react-query';
import { useChatsStore } from '@/stores/chats';

export function useChatActions(profileId: string) {
  const send = useMutation({
    mutationKey: mutationKeys.member.sendMessage(profileId).mutationKey,
    mutationFn: (text: string) => useChatsStore.getState().sendMessage(profileId, text),
  });
  const older = useMutation({
    mutationKey: mutationKeys.member.loadOlderMessages(profileId).mutationKey,
    mutationFn: () => useChatsStore.getState().loadOlder(profileId),
  });
  return { sendMessage: send.mutateAsync, loadOlder: older.mutateAsync };
}
