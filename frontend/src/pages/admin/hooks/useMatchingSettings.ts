import { queryKeys } from '@/lib/query-keys';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api';
import { useAdmin } from './useAdmin';

export default function useMatchingSettings() {
  const { authenticated, username } = useAdmin();
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: queryKeys.admin.account(username)._ctx.matching.queryKey,
    queryFn: adminApi.matching,
    enabled: authenticated,
  });
  const data = query.data ?? null;
  return {
    data,
    loading: query.isFetching,
    error: query.error?.message ?? '',
    notice,
    setNotice,
    refresh: () => {
      void query.refetch();
    },
    visiblePresets: data?.presets.filter((preset) => !preset.deletedAt) ?? [],
    activePreset: data?.presets.find((preset) => preset.id === data.activeId),
  };
}
