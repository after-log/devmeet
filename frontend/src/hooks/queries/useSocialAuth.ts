import { queryKeys, mutationKeys } from '@/lib/query-keys';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useSocialAuth() {
  const providers = useQuery({
    queryKey: queryKeys.public.providers.queryKey,
    queryFn: api.providers,
  });
  const link = useMutation({
    mutationKey: mutationKeys.member.socialLink.mutationKey,
    mutationFn: api.link,
  });
  return {
    providers: providers.data,
    error: providers.error?.message ?? '',
    link: link.mutateAsync,
  };
}
