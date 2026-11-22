import { queryKeys } from '@/lib/query-keys';
import { queryOptions } from '@tanstack/react-query';
import { api } from './api';

export const sessionQuery = queryOptions({
  queryKey: queryKeys.member.session.queryKey,
  queryFn: api.me,
  staleTime: 0,
});
export const memberSnapshotQuery = (owner: string) =>
  queryOptions({
    queryKey: queryKeys.member.account(owner)._ctx.snapshot.queryKey,
    queryFn: async () => {
      const [recommendations, connections, me] = await Promise.all([
        api.recommendations(),
        api.connections(),
        api.me(),
      ]);
      if (me.user?.id !== owner) throw new Error('로그인 정보가 변경되었어요. 다시 연결해 주세요.');
      return { recommendations, connections, user: me.user };
    },
  });
export const messagesQuery = (owner: string, peer: string, before?: string) =>
  queryOptions({
    queryKey: queryKeys.member.account(owner)._ctx.messages(peer)._ctx.page(before).queryKey,
    queryFn: () => api.messages(peer, before),
    staleTime: 0,
  });
