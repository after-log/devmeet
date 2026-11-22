import { queryKeys } from '@/lib/query-keys';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api';
import { useAdmin } from './useAdmin';

export default function useCompanyEmails() {
  const { authenticated, username } = useAdmin();
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: queryKeys.admin.account(username)._ctx.companyEmails.queryKey,
    queryFn: adminApi.companyEmails,
    enabled: authenticated,
  });
  return {
    data: query.data ?? null,
    loading: query.isFetching,
    error: query.error?.message ?? '',
    notice,
    refresh: () => {
      void query.refetch();
    },
    saved: () => {
      setNotice('기업 이메일 인증 설정을 저장했어요.');
    },
  };
}
