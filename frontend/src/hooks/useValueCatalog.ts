import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';
import demoSections from '@/data/value-questions.json';
import { request } from '@/lib/api';

export type ValueQuestion = { id: string; text: string; purpose: string; options: string[] };
export type ValueSection = {
  id: string;
  label: string;
  english: string;
  icon: string;
  description: string;
  questions: ValueQuestion[];
};
export function useValueCatalog(demo = false) {
  const query = useQuery({
    queryKey: queryKeys.public.valueCatalog.queryKey,
    queryFn: () => request<{ sections: ValueSection[] }>('/value-questions'),
    enabled: !demo,
  });
  return {
    sections: demo ? demoSections : (query.data?.sections ?? []),
    loading: !demo && query.isPending,
    error: demo ? '' : (query.error?.message ?? ''),
    refresh: () => query.refetch(),
  };
}
