import { ChevronLeft } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import WorkEmailVerification from '@/components/WorkEmailVerification';
import SocialButtons from '@/components/SocialButtons';
import { useApp } from '@/stores/app';

const VerificationPage = () => {
  const { user, demo } = useApp();

  if (!demo && !user) return <Navigate to="/me" replace />;

  return (
    <>
      <Link to="/me" className="mb-6 inline-flex items-center gap-1 text-xs text-fg-3">
        <ChevronLeft size={16} /> 내 프로필
      </Link>
      <p className="eyebrow">// my.verification</p>
      <h2>인증 관리</h2>
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
      <section className="panel" aria-labelledby="github-heading">
        <h3 id="github-heading">GitHub 인증</h3>
        <p className="muted">
          본인 소유의 GitHub 계정인지 확인해요. 개발 경력이나 재직 여부를 증명하지는 않아요.
        </p>
        {demo ? (
          <p className="muted">
            GitHub 인증은 둘러보기를 종료하고 카카오로 로그인한 뒤 이용해 주세요.
          </p>
        ) : user?.verification?.github ? (
          <p className="text-sm text-green" role="status">
            GitHub 인증 완료
          </p>
        ) : (
          <SocialButtons link />
        )}
      </section>
    </>
  );
};

export default VerificationPage;
