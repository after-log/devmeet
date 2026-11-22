import { queryKeys, mutationKeys, isSessionQueryKey } from '@/lib/query-keys';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clearQueryScope } from '@/lib/query-client';
import { ApiError } from '@/lib/api';
import { adminApi, adminDate } from '../api';
import type { Member, Question, QuestionDraft, Report, ReviewStatus } from '../types';

type AdminDialog =
  | { type: 'profile'; member: Member }
  | { type: 'member'; member: Member }
  | { type: 'report'; report: Report }
  | { type: 'question' }
  | null;
function useAdminState() {
  const client = useQueryClient();
  const session = useQuery({
    queryKey: queryKeys.admin.session.queryKey,
    queryFn: adminApi.me,
    staleTime: 0,
  });
  const authenticated = session.data?.authenticated ?? false;
  const username = session.data?.username ?? '';
  const directory = useQuery({
    queryKey: queryKeys.admin.account(username)._ctx.directory.queryKey,
    enabled: authenticated,
    queryFn: async () => {
      const [members, reports, catalog] = await Promise.all([
        adminApi.members(),
        adminApi.reports(),
        adminApi.questions(),
      ]);
      return {
        members: members.map((member) => ({ ...member, joined: adminDate(member.joined) })),
        reports: reports.map((report) => ({ ...report, date: adminDate(report.date, true) })),
        questions: catalog.questions,
        categories: catalog.sections.map(({ id, label }) => ({ id, label })),
      };
    },
  });
  const members = directory.data?.members ?? [];
  const reports = directory.data?.reports ?? [];
  const questions = directory.data?.questions ?? [];
  const categories = directory.data?.categories ?? [];
  const booting = session.isPending;
  const loading = directory.isFetching;
  const action = useMutation({
    mutationKey: mutationKeys.admin.action.mutationKey,
    mutationFn: (run: () => Promise<unknown>) => run(),
  });
  const busy = action.isPending;
  const [dialog, setDialog] = useState<AdminDialog>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const clearSession = useCallback(async () => {
    await clearQueryScope('admin');
    client.setQueryData(queryKeys.admin.session.queryKey, { authenticated: false, username: '' });
    setDialog(null);
  }, [client]);
  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) void clearSession();
      setError(error instanceof Error ? error.message : '서버 요청을 처리하지 못했어요.');
    },
    [clearSession],
  );
  useEffect(() => {
    const error = session.error ?? directory.error;
    if (error) handleError(error);
  }, [session.error, directory.error, handleError]);
  const refresh = useCallback(async () => {
    await client.invalidateQueries({
      queryKey: queryKeys.admin._def,
      predicate: (query) => !isSessionQueryKey(query.queryKey),
    });
  }, [client]);
  const initialize = async () => {
    await session.refetch();
  };
  const login = async (id: string, password: string) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    try {
      const session = (await action.mutateAsync(() => adminApi.login(id, password))) as Awaited<
        ReturnType<typeof adminApi.login>
      >;
      await clearSession();
      client.setQueryData(queryKeys.admin.session.queryKey, session);
      setError('');
      await refresh();
      return true;
    } finally {
      inFlight.current = false;
    }
  };
  const logout = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await action.mutateAsync(adminApi.logout);
      await clearSession();
      setError('');
    } catch (error) {
      handleError(error);
    } finally {
      inFlight.current = false;
    }
  };
  const run = async (mutationAction: () => Promise<unknown>, message: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError('');
    try {
      await action.mutateAsync(mutationAction);
      await client.invalidateQueries({ queryKey: queryKeys.public.valueCatalog.queryKey });
      setDialog(null);
      setNotice(message);
      await refresh();
    } catch (error) {
      handleError(error);
    } finally {
      inFlight.current = false;
    }
  };
  return {
    authenticated,
    booting,
    loading,
    busy,
    username,
    members,
    reports,
    questions,
    categories,
    dialog,
    notice,
    error,
    login,
    logout,
    refresh,
    initialize,
    closeDialog: () => {
      if (!inFlight.current) setDialog(null);
    },
    reviewProfile: (member: Member, status: ReviewStatus, reason: string) =>
      run(
        () => adminApi.reviewProfile(member, status, reason),
        `${member.name}님의 프로필 검수를 저장했어요.`,
      ),
    reviewReport: (report: Report, status: 'VALID' | 'DISMISSED', note: string) =>
      run(() => adminApi.reviewReport(report, status, note), '신고 검토 결과를 저장했어요.'),
    toggleSuspension: (member: Member, reason: string) =>
      run(
        () => adminApi.suspend(member, reason),
        member.suspended ? '이용 제한을 해제했어요.' : '회원의 이용을 제한했어요.',
      ),
    toggleQuestion: (question: Question) =>
      run(
        () => adminApi.activateQuestion(question),
        `${question.id} 문항을 ${question.active ? '비활성화' : '활성화'}했어요.`,
      ),
    addQuestion: (draft: QuestionDraft) =>
      run(() => adminApi.addQuestion(draft), '새 가치관 문항을 추가했어요.'),
    openReview: (member: Member) => {
      if (member.hasProfile) setDialog({ type: 'profile', member });
    },
    openMember: (member: Member) => setDialog({ type: 'member', member }),
    openReport: (report: Report) => setDialog({ type: 'report', report }),
    openQuestion: () => setDialog({ type: 'question' }),
  };
}
const AdminContext = createContext<ReturnType<typeof useAdminState> | null>(null);
export function AdminProvider({ children }: { children: ReactNode }) {
  const value = useAdminState();
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('관리자 화면은 AdminProvider 안에서 사용해야 합니다.');
  return context;
}
