import SocialButtons from '@/components/SocialButtons';
import { useApp } from '@/stores/app';

const GithubVerificationPage = () => {
  const { user, demo } = useApp();

  return (
    <>
      <p className="eyebrow">// verification.github</p>
      <h2>GitHub 인증</h2>
      <section className="panel" aria-label="GitHub 계정 인증">
        <p className="muted">
          본인 소유의 GitHub 계정인지 확인해요. 개발 경력이나 재직 여부를 증명하지는 않아요.
        </p>
        {demo ? (
          <p className="muted">
            GitHub 인증은 둘러보기를 종료하고 카카오로 로그인한 뒤 이용해 주세요.
          </p>
        ) : user?.verification?.github ? (
          <p className="text-sm text-point" role="status">
            GitHub 인증 완료
          </p>
        ) : (
          <SocialButtons link />
        )}
      </section>
    </>
  );
};

export default GithubVerificationPage;
