import { queryKeys, mutationKeys } from '@/lib/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import type { WorkEmailStatus } from '@/lib/workEmail';
import { useApp } from '@/stores/app';
import type { z } from 'zod';
import type {
  workEmailRequestSchema,
  workEmailCodeSchema,
  companyEmailReviewSchema,
} from '@/validation/companyEmail';

export function useWorkEmail() {
  const client = useQueryClient();
  const owner = useApp((s) => s.user?.id);
  const key = queryKeys.member.account(owner)._ctx.workEmail.queryKey;
  const query = useQuery({
    queryKey: key,
    queryFn: () => request<WorkEmailStatus>('/work-email'),
    enabled: !!owner,
  });
  return { ...query, setStatus: (status: WorkEmailStatus) => client.setQueryData(key, status) };
}
export function useWorkEmailMutations() {
  const client = useQueryClient();
  const owner = useApp((s) => s.user?.id);
  const onSuccess = (status: WorkEmailStatus) => {
    client.setQueryData(queryKeys.member.account(owner)._ctx.workEmail.queryKey, status);
  };
  const send = useMutation({
    mutationKey: mutationKeys.member.workEmailRequest.mutationKey,
    mutationFn: (input: z.output<typeof workEmailRequestSchema>) =>
      request<WorkEmailStatus>('/work-email/request', 'POST', input),
    onSuccess,
  });
  const verify = useMutation({
    mutationKey: mutationKeys.member.workEmailVerify.mutationKey,
    mutationFn: (input: z.output<typeof workEmailCodeSchema>) =>
      request<WorkEmailStatus>('/work-email/verify', 'POST', input),
    onSuccess,
  });
  const review = useMutation({
    mutationKey: mutationKeys.member.companyReview.mutationKey,
    mutationFn: (input: z.output<typeof companyEmailReviewSchema>) =>
      request<WorkEmailStatus>('/work-email/company-review', 'POST', input),
    onSuccess,
  });
  return {
    send: send.mutateAsync,
    verify: verify.mutateAsync,
    review: review.mutateAsync,
    refresh: () =>
      client.fetchQuery({
        queryKey: queryKeys.member.account(owner)._ctx.workEmail.queryKey,
        queryFn: () => request<WorkEmailStatus>('/work-email'),
        staleTime: 0,
      }),
  };
}
