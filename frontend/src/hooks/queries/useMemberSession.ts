import { queryKeys } from '@/lib/query-keys';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { memberSnapshotQuery, sessionQuery } from '@/lib/member-queries';
import { useApp } from '@/stores/app';

/** Zustand keeps the existing screen/demo projection; Query owns fetching and freshness. */
export function useMemberSession() {
  const { demo } = useApp();
  const client = useQueryClient();
  const session = useQuery({ ...sessionQuery, enabled: !demo });
  const user = session.data?.user;
  const snapshot = useQuery({
    ...memberSnapshotQuery(user?.id ?? ''),
    enabled: !demo && !!user?.profile,
    refetchInterval: 30_000,
  });
  useEffect(() => {
    if (demo) return;
    if (session.isPending) return;
    if (user?.profile && snapshot.isPending) return;
    const data = user?.profile ? snapshot.data : undefined;
    const error = session.error ?? snapshot.error;
    useApp.setState((state) => ({
      booted: true,
      user: data && snapshot.dataUpdatedAt >= session.dataUpdatedAt ? data.user : (user ?? null),
      ...(!user?.profile
        ? {
            people: [],
            liked: [],
            connections: { sent: [], received: [], matches: [] },
            index: 0,
            remaining: 3,
            notice: '',
          }
        : {}),
      ...(data
        ? {
            people: data.recommendations.people,
            liked: data.recommendations.liked,
            remaining: data.recommendations.remaining,
            connections: data.connections,
            notice: data.recommendations.notice ?? '',
            index: Math.min(state.index, Math.max(0, data.recommendations.people.length - 1)),
          }
        : {}),
      error: error?.message ?? '',
    }));
  }, [
    demo,
    session.isPending,
    session.error,
    user,
    snapshot.isPending,
    snapshot.data,
    snapshot.error,
    snapshot.dataUpdatedAt,
    session.dataUpdatedAt,
  ]);
  return {
    reconnect: async () => {
      const result = await session.refetch();
      const owner = result.data?.user;
      if (owner?.profile)
        await client.invalidateQueries({
          queryKey: queryKeys.member.account(owner.id)._ctx.snapshot.queryKey,
        });
    },
  };
}
