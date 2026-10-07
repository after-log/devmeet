import { toast } from 'sonner';
import { useProfileActions } from '../hooks/useProfileActions';
import { useDevmeetStore } from '../stores/devmeet';
import { useShallow } from 'zustand/react/shallow';
import Signup from '../components/Signup';

const SignupPage = () => {
  const { profile, setProfile, step, setStep } = useDevmeetStore(
    useShallow((s) => ({
      profile: s.profile,
      setProfile: s.setProfile,
      step: s.step,
      setStep: s.setStep,
    })),
  );
  const { enter } = useProfileActions();
  const notify = (message: string) => {
    toast(message);
  };
  return (
    <Signup
      profile={profile}
      onChange={setProfile}
      step={step}
      onStep={setStep}
      onEnter={enter}
      notify={notify}
    />
  );
};
export default SignupPage;
