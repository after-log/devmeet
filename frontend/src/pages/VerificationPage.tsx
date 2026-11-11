import { Link } from 'react-router-dom';

const VerificationPage = () => (
  <>
    <p className="eyebrow">// my.verification</p>
    <h2>인증 관리</h2>
    <p className="intro">진행할 인증을 선택해 주세요.</p>
    <Link className="settings-row gap-4" to="/me/verification/company">
      <div className="min-w-0">
        <strong className="block text-sm">회사 인증</strong>
        <p className="mt-2 mb-0 text-xs leading-relaxed text-fg-3">
          회사 이메일로 인증번호를 받아 확인해요.
        </p>
      </div>
      <span aria-hidden="true">›</span>
    </Link>
    <Link className="settings-row gap-4" to="/me/verification/github">
      <div className="min-w-0">
        <strong className="block text-sm">GitHub 인증</strong>
        <p className="mt-2 mb-0 text-xs leading-relaxed text-fg-3">
          GitHub 계정을 연결해 본인 소유인지 확인해요.
        </p>
      </div>
      <span aria-hidden="true">›</span>
    </Link>
  </>
);

export default VerificationPage;
