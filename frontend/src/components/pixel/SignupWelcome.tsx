import { ArrowRight } from 'lucide-react';
import PageScene from './PageScene';

const SignupWelcome = ({ name, onContinue }: { name?: string; onContinue: () => void }) => (
  <>
    <p className="eyebrow">// welcome to devmeet</p>
    <PageScene name="welcome" />
    <h2 className="onboard-hero">
      가입이
      <br />
      완료됐어요.
    </h2>
    <p className="onboard-lead">
      {name ? `${name}님, ` : ''}이제 프로필을 만들어 볼까요?
      <br />네 단계면 충분해요.
    </p>
    <button className="btn full" onClick={onContinue}>
      프로필 만들기 <ArrowRight className="ico" aria-hidden="true" />
    </button>
  </>
);

export default SignupWelcome;
