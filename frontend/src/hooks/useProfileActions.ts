import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useDevmeetStore } from '../stores/devmeet';

export const useProfileActions = () => {
  const navigate = useNavigate();
  const actions = useDevmeetStore(
    useShallow((s) => ({ replay: s.replay, jump: s.jump, enter: s.enter })),
  );
  return {
    replay: () => {
      actions.replay();
      navigate('/signup');
    },
    jump: (step: number) => {
      actions.jump(step);
      navigate('/signup');
    },
    enter: () => {
      actions.enter();
      navigate('/discover');
    },
  };
};
