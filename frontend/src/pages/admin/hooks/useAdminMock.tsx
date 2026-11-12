import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  initialMembers,
  initialQuestions,
  initialReports,
  type Member,
  type Question,
  type Report,
  type ReviewStatus,
} from '../mock';
import { reviewLabels } from '../components/AdminUI';

type AdminDialog =
  | { type: 'profile'; member: Member }
  | { type: 'member'; member: Member }
  | { type: 'report'; report: Report }
  | { type: 'question' }
  | null;

function useAdminMockState() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('devmeet-admin-mock') === 'true',
  );
  const [members, setMembers] = useState(initialMembers);
  const [reports, setReports] = useState(initialReports);
  const [questions, setQuestions] = useState(initialQuestions);
  const [dialog, setDialog] = useState<AdminDialog>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const closeDialog = () => setDialog(null);
  const login = (id: string, password: string) => {
    if (id !== 'admin' || password !== 'devmeet123!') return false;
    sessionStorage.setItem('devmeet-admin-mock', 'true');
    setAuthenticated(true);
    return true;
  };
  const logout = () => {
    sessionStorage.removeItem('devmeet-admin-mock');
    setAuthenticated(false);
    closeDialog();
    setNotice('');
  };
  const reviewProfile = (member: Member, status: ReviewStatus, reason: string) => {
    if (status === 'REJECTED' && !reason.trim()) return;
    setMembers((all) =>
      all.map((m) => (m.id === member.id ? { ...m, review: status, reason: reason.trim() } : m)),
    );
    closeDialog();
    setNotice(`${member.name}님의 프로필을 ${reviewLabels[status]} 처리했어요.`);
  };
  const reviewReport = (report: Report, status: 'VALID' | 'DISMISSED', note: string) => {
    if (report.status !== 'OPEN' || !note.trim()) return;
    setReports((all) =>
      all.map((r) => (r.id === report.id ? { ...r, status, note: note.trim() } : r)),
    );
    closeDialog();
    setNotice('신고 검토 결과를 저장했어요.');
  };
  const toggleSuspension = (member: Member, reason: string) => {
    if (!reason.trim()) return;
    setMembers((all) =>
      all.map((m) => (m.id === member.id ? { ...m, suspended: !m.suspended } : m)),
    );
    closeDialog();
    setNotice(member.suspended ? '이용 제한을 해제했어요.' : '회원의 이용을 제한했어요.');
  };
  const toggleQuestion = (question: Question) => {
    setQuestions((all) => all.map((q) => (q.id === question.id ? { ...q, active: !q.active } : q)));
    setNotice(`${question.id} 문항을 ${question.active ? '비활성화' : '활성화'}했어요.`);
  };
  const addQuestion = (draft: Omit<Question, 'id' | 'active'>) => {
    const options = draft.options.map((option) => option.trim());
    if (
      !draft.text.trim() ||
      options.length !== 4 ||
      options.some((option) => !option) ||
      new Set(options).size !== 4
    )
      return;
    setQuestions((all) => [
      {
        ...draft,
        text: draft.text.trim(),
        options,
        id: `Q${String(all.length + 1).padStart(3, '0')}`,
        active: true,
      },
      ...all,
    ]);
    closeDialog();
    setNotice('새 가치관 문항을 추가했어요.');
  };
  return {
    authenticated,
    members,
    reports,
    questions,
    dialog,
    notice,
    login,
    logout,
    closeDialog,
    reviewProfile,
    reviewReport,
    toggleSuspension,
    toggleQuestion,
    addQuestion,
    openReview: (member: Member) => setDialog({ type: 'profile', member }),
    openMember: (member: Member) => setDialog({ type: 'member', member }),
    openReport: (report: Report) => setDialog({ type: 'report', report }),
    openQuestion: () => setDialog({ type: 'question' }),
  };
}

const AdminMockContext = createContext<ReturnType<typeof useAdminMockState> | null>(null);
export function AdminMockProvider({ children }: { children: ReactNode }) {
  const value = useAdminMockState();
  return <AdminMockContext.Provider value={value}>{children}</AdminMockContext.Provider>;
}
export function useAdminMock() {
  const context = useContext(AdminMockContext);
  if (!context) throw new Error('관리자 화면은 AdminMockProvider 안에서 사용해야 합니다.');
  return context;
}
