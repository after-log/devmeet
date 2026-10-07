import { useProfileActions } from '../hooks/useProfileActions';
import { useDevmeetStore } from '../stores/devmeet';
import { useShallow } from 'zustand/react/shallow';
import MyProfile from '../components/MyProfile';

const MyProfilePage = () => {
  const { profile, settings } = useDevmeetStore(
    useShallow((s) => ({ profile: s.profile, settings: s.settings })),
  );
  const { jump, replay } = useProfileActions();
  return <MyProfile profile={profile} onJump={jump} onSettings={settings} onReplay={replay} />;
};
export default MyProfilePage;
