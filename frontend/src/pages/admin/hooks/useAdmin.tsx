import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from '@/lib/api';
import { adminApi, adminDate } from '../api';
import type { Category, Member, Question, QuestionDraft, Report, ReviewStatus } from '../types';

type AdminDialog =
  | { type: 'profile'; member: Member }
  | { type: 'member'; member: Member }
  | { type: 'report'; report: Report }
  | { type: 'question' }
  | null;
function useAdminState() {
  const [authenticated, setAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialog, setDialog] = useState<AdminDialog>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const clearSession = useCallback(() => {
    generation.current++;
    setBooting(false);
    setLoading(false);
    setAuthenticated(false);
    setUsername('');
    setMembers([]);
    setReports([]);
    setQuestions([]);
    setCategories([]);
    setDialog(null);
  }, []);
  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) clearSession();
      setError(error instanceof Error ? error.message : '서버 요청을 처리하지 못했어요.');
    },
    [clearSession],
  );
  const refresh = useCallback(async () => {
    const version = generation.current;
    setLoading(true);
    try {
      const [members, reports, catalog] = await Promise.all([
        adminApi.members(),
        adminApi.reports(),
        adminApi.questions(),
      ]);
      if (version !== generation.current) return;
      setMembers(members.map((member) => ({ ...member, joined: adminDate(member.joined) })));
      setReports(reports.map((report) => ({ ...report, date: adminDate(report.date, true) })));
      setQuestions(catalog.questions);
      setCategories(catalog.sections.map(({ id, label }) => ({ id, label })));
      setError('');
    } catch (error) {
      if (version === generation.current) handleError(error);
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [handleError]);
  const initialize = useCallback(async () => {
    const version = ++generation.current;
    setBooting(true);
    setError('');
    try {
      const session = await adminApi.me();
      if (version !== generation.current) return;
      setAuthenticated(session.authenticated);
      setUsername(session.username);
      if (session.authenticated) await refresh();
    } catch (error) {
      if (version === generation.current) handleError(error);
    } finally {
      if (version === generation.current) setBooting(false);
    }
  }, [refresh, handleError]);
  useEffect(() => {
    void initialize();
    return () => {
      generation.current++;
    };
  }, [initialize]);
  const login = async (id: string, password: string) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    try {
      const session = await adminApi.login(id, password);
      setAuthenticated(session.authenticated);
      setUsername(session.username);
      setError('');
      await refresh();
      return true;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const logout = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await adminApi.logout();
      clearSession();
      setError('');
    } catch (error) {
      handleError(error);
    } finally {
      inFlight.current = false;
      setBusy(false);
      setLoading(false);
    }
  };
  const run = async (action: () => Promise<unknown>, message: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      setDialog(null);
      setNotice(message);
      await refresh();
    } catch (error) {
      handleError(error);
    } finally {
      inFlight.current = false;
      setBusy(false);
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
