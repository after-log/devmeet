import { useAdmin } from '../hooks/useAdmin';
import MemberDetailDialog from './MemberDetailDialog';
import ProfileReviewDialog from './ProfileReviewDialog';
import QuestionCreateDialog from './QuestionCreateDialog';
import ReportReviewDialog from './ReportReviewDialog';

export default function AdminDialogs() {
  const { dialog } = useAdmin();
  if (!dialog) return null;
  switch (dialog.type) {
    case 'profile':
      return <ProfileReviewDialog key={dialog.member.id} member={dialog.member} />;
    case 'member':
      return <MemberDetailDialog key={dialog.member.id} member={dialog.member} />;
    case 'report':
      return <ReportReviewDialog key={dialog.report.id} report={dialog.report} />;
    case 'question':
      return <QuestionCreateDialog />;
  }
}
