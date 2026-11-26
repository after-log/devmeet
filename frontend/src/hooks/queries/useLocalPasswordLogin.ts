import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useLocalPasswordLogin() {
  const { data } = useQuery({
    queryKey: queryKeys.public.authCapabilities.queryKey,
    queryFn: api.authCapabilities,
  });
  return data?.localPasswordLogin === true;
}
