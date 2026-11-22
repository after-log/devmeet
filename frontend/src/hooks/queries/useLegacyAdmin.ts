import { queryKeys, mutationKeys } from '@/lib/query-keys';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
type Dashboard = {
  counts: Record<string, number>;
  photos: { id: string; name: string; photo: string; photos: string[]; status: string }[];
  reports: { id: string; senderId: string; targetId: string; reason: string; status: string }[];
  pool: { role: string; count: number }[];
};
export function useLegacyAdmin(page: number, enabled: boolean) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.admin.legacy(page).queryKey,
    queryFn: () => request<Dashboard>('/admin?page=' + page),
    enabled,
  });
  const mutation = useMutation({
    mutationKey: mutationKeys.admin.legacyUpdate.mutationKey,
    mutationFn: ({ path, body }: { path: string; body: unknown }) => request(path, 'PUT', body),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.admin._def }),
  });
  return {
    data: query.data,
    error: query.error?.message ?? '',
    busy: mutation.isPending,
    act: (path: string, body: unknown) => mutation.mutateAsync({ path, body }),
  };
}
