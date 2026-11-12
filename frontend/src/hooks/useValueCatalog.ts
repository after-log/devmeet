import { useEffect } from 'react';
import { create } from 'zustand';
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
let pending: Promise<void> | null = null;
const useCatalogStore = create<{
  sections: ValueSection[];
  loaded: boolean;
  loading: boolean;
  error: string;
  load: () => Promise<void>;
}>((set) => ({
  sections: [],
  loaded: false,
  loading: false,
  error: '',
  load: () => {
    if (pending) return pending;
    set({ loading: true, error: '' });
    pending = request<{ sections: ValueSection[] }>('/value-questions')
      .then(({ sections }) => {
        set({ sections, loaded: true });
      })
      .catch((error) => {
        set({ error: error instanceof Error ? error.message : '가치관 문항을 불러오지 못했어요.' });
      })
      .finally(() => {
        pending = null;
        set({ loading: false });
      });
    return pending;
  },
}));
export function useValueCatalog(demo = false) {
  const { sections, loaded, loading, error, load } = useCatalogStore();
  useEffect(() => {
    if (demo) return;
    void load();
    const refresh = () => {
      void load();
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [demo, load]);
  return {
    sections: demo ? demoSections : sections,
    loading: !demo && (!loaded || loading),
    error: demo ? '' : error,
    refresh: load,
  };
}
