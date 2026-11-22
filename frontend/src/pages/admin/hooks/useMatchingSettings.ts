import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { MatchingSettings } from '../types';
import { useAdmin } from './useAdmin';

export default function useMatchingSettings() {
  const { loading: refreshing } = useAdmin();
  const [data, setData] = useState<MatchingSettings | null>(null);
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
      .matching()
      .then((result) => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch((error: unknown) => {
        if (active)
          setError(error instanceof Error ? error.message : '매칭 설정을 불러오지 못했어요.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision, refreshing]);
  const visiblePresets = data?.presets.filter((preset) => !preset.deletedAt) ?? [];
  const activePreset = data?.presets.find((preset) => preset.id === data.activeId);
  return {
    data,
    setData,
    loading,
    error,
    notice,
    setNotice,
    refresh,
    visiblePresets,
    activePreset,
  };
}
