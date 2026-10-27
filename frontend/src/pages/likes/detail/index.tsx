import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { profiles } from '@/data/profiles';
import { useChatsStore } from '@/stores/chats';
import { useLikesStore } from '@/stores/likes';
import { useLikes } from '../hooks/useLikes';
import LikeProfile from './components/LikeProfile';

const LikeDetailPage = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const entries = useLikes();
  const profile = profiles.find((profile) => profile.initial === profileId);
  const entry = entries.find((entry) => entry.profileId === profileId);
  const matched = useChatsStore((s) => s.rooms.some((room) => room.profileId === profileId));
  const startChat = useChatsStore((s) => s.startChat);
  const dismiss = useLikesStore((s) => s.dismiss);

  if (!profile || !entry) return <Navigate to="/likes" replace />;

  return (
    <LikeProfile
      profile={profile}
      entry={entry}
      matched={matched}
      onBack={() => navigate('/likes')}
      onChat={() => navigate(`/chat/${profile.initial}`)}
      onAccept={() => {
        startChat(profile.initial);
        toast(`${profile.name}님과 마음이 통했어요. 첫 인사를 건네보세요!`);
        navigate(`/chat/${profile.initial}`);
      }}
      onDismiss={() => {
        dismiss(profile.initial);
        toast('받은 호감을 정리했어요.');
        navigate('/likes', { replace: true });
      }}
    />
  );
};
export default LikeDetailPage;
