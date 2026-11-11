import WorkEmailVerification from '@/components/WorkEmailVerification';
import { useApp } from '@/stores/app';

const CompanyVerificationPage = () => {
  const { user, demo } = useApp();

  return (
    <>
      <p className="eyebrow">// verification.company</p>
      <h2>회사 인증</h2>
      {demo ? (
        <section className="panel" aria-labelledby="work-email-heading">
          <h3 id="work-email-heading">회사 이메일 확인</h3>
          <p className="muted">
            회사 인증은 둘러보기를 종료하고 카카오로 로그인한 뒤 이용해 주세요.
          </p>
        </section>
      ) : (
        user && <WorkEmailVerification key={user.id} />
      )}
    </>
  );
};

export default CompanyVerificationPage;
