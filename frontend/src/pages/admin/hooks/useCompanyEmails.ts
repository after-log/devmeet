import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { CompanyEmailDirectory } from '../types';
import { useAdmin } from './useAdmin';

export default function useCompanyEmails() {
  const { loading: refreshing } = useAdmin();
  const [data, setData] = useState<CompanyEmailDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    if (refreshing) return;
    setLoading(true);
    adminApi
      .companyEmails()
      .then((result) => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch((error: unknown) => {
        if (active)
          setError(error instanceof Error ? error.message : '기업 인증 목록을 불러오지 못했어요.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision, refreshing]);

  const saved = useCallback(() => {
    setNotice('기업 이메일 인증 설정을 저장했어요.');
    refresh();
  }, [refresh]);

  return { data, loading, error, notice, refresh, saved };
}
