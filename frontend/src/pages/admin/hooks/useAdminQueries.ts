import { queryKeys, mutationKeys, isSessionQueryKey } from '@/lib/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api';
import { useAdmin } from './useAdmin';

export function useAdminStatistics(days: 7 | 30) {
  const { authenticated, username } = useAdmin();
  const query = useQuery({
    queryKey: queryKeys.admin.account(username)._ctx.statistics(days).queryKey,
    queryFn: () => adminApi.statistics(days),
    enabled: authenticated,
  });
  return {
    data: query.data,
    loading: query.isFetching,
    error: query.error?.message ?? '',
    refresh: () => {
      void query.refetch();
    },
  };
}
export function useCompanyEmailMutations() {
  const client = useQueryClient();
  const onSuccess = () =>
    client.invalidateQueries({
      queryKey: queryKeys.admin._def,
      predicate: (query) => !isSessionQueryKey(query.queryKey),
    });
  const review = useMutation({
    mutationKey: mutationKeys.admin.companyEmailReview.mutationKey,
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof adminApi.reviewCompanyEmail>[1];
    }) => adminApi.reviewCompanyEmail(id, input),
    onSuccess,
  });
  const register = useMutation({
    mutationKey: mutationKeys.admin.companyDomainRegister.mutationKey,
    mutationFn: adminApi.registerCompanyDomain,
    onSuccess,
  });
  const activate = useMutation({
    mutationKey: mutationKeys.admin.companyDomainActivate.mutationKey,
    mutationFn: ({ domain, active, note }: { domain: string; active: boolean; note: string }) =>
      adminApi.activateCompanyDomain(domain, active, note),
    onSuccess,
  });
  return {
    review: (id: string, input: Parameters<typeof adminApi.reviewCompanyEmail>[1]) =>
      review.mutateAsync({ id, input }),
    register: register.mutateAsync,
    activate: (domain: string, active: boolean, note: string) =>
      activate.mutateAsync({ domain, active, note }),
  };
}
export function useMatchingMutations() {
  const client = useQueryClient();
  const onSuccess = () =>
    client.invalidateQueries({
      queryKey: queryKeys.admin._def,
      predicate: (query) => !isSessionQueryKey(query.queryKey),
    });
  const create = useMutation({
    mutationKey: mutationKeys.admin.matchingCreate.mutationKey,
    mutationFn: adminApi.createMatchingPreset,
    onSuccess,
  });
  const remove = useMutation({
    mutationKey: mutationKeys.admin.matchingDelete.mutationKey,
    mutationFn: adminApi.deleteMatchingPreset,
    onSuccess,
  });
  const activate = useMutation({
    mutationKey: mutationKeys.admin.matchingActivate.mutationKey,
    mutationFn: adminApi.activateMatchingPreset,
    onSuccess,
  });
  return { create: create.mutateAsync, remove: remove.mutateAsync, activate: activate.mutateAsync };
}
