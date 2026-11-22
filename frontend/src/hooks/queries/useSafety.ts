import { queryKeys, mutationKeys } from '@/lib/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApp } from '@/stores/app';

export function useSafetyMutations() {
  const client = useQueryClient();
  const owner = useApp((s) => s.user?.id);
  const block = useMutation({
    mutationKey: mutationKeys.member.block.mutationKey,
    mutationFn: ({ id, remove }: { id: string; remove?: boolean }) =>
      remove ? api.unblock(id) : api.block(id),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.member.account(owner).queryKey }),
  });
  const report = useMutation({
    mutationKey: mutationKeys.member.report.mutationKey,
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.report(id, reason),
  });
  return {
    block: (id: string, remove = false) => block.mutateAsync({ id, remove }),
    report: (id: string, reason: string) => report.mutateAsync({ id, reason }),
  };
}
export function useBlockedPeople() {
  const { user, demo } = useApp();
  return useQuery({
    queryKey: queryKeys.member.account(user?.id)._ctx.blocks.queryKey,
    queryFn: api.blocks,
    enabled: !!user && !demo,
  });
}
