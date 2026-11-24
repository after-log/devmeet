import WorkEmailVerification from '@/components/WorkEmailVerification';
import { useApp } from '@/stores/app';

const CompanyVerificationPage = () => {
  const { user, demo } = useApp();

  if (demo)
    return (
      <section className="panel mt-0" aria-label="회사 이메일 확인">
        <p className="muted">회사 인증은 둘러보기를 종료하고 카카오로 로그인한 뒤 이용해 주세요.</p>
      </section>
    );
  return user && <WorkEmailVerification key={user.id} />;
};

export default CompanyVerificationPage;
