import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../stores/app';
import SocialButtons from '@/components/SocialButtons';

const AuthPage = () => {
  const { user } = useApp();
  const [params] = useSearchParams();
  if (user) return <Navigate to={user.profile ? '/today' : '/onboarding'} replace />;
  return (
    <>
      <Link className="back block" to="/">
        ← 처음으로
      </Link>
      <p className="eyebrow">$ devmeet login</p>
      <h2 className="onboard-hero">
        오늘의 인연이
        <br />
        기다리고 있어요.
      </h2>
      <p className="onboard-lead">카카오 계정으로 간편하게 시작하세요.</p>
      {params.get('oauth') === 'error' && (
        <p className="error" role="alert">
          카카오 로그인에 실패했어요. 다시 시도해 주세요.
        </p>
      )}
      <SocialButtons />
    </>
  );
};
export default AuthPage;
