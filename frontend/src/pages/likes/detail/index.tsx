import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { findPerson, reasonFor, useApp } from '@/stores/app';
import { useLikes } from '../hooks/useLikes';
import LikeProfile from './components/LikeProfile';

const LikeDetailPage = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const entries = useLikes();
  const { connections, people, liked, remaining, like, demo, openSheet } = useApp();
  const [pending, setPending] = useState(false);
  const profile = findPerson(profileId);
  const entry = entries.find((entry) => entry.profileId === profileId);
  const matched = connections.matches.some((p) => p.id === profileId);
  const sent = liked.includes(profileId ?? '') || connections.sent.some((p) => p.id === profileId);
  const inToday = people.some((p) => p.id === profileId);

  if (!profile || !entry) return <Navigate to="/likes" replace />;

  return (
    <LikeProfile
      profile={profile}
      entry={entry}
      matched={matched}
      demo={demo}
      reason={reasonFor(profile)}
      canAccept={!sent && inToday && remaining > 0 && !pending}
      acceptLabel={
        pending
          ? '호감을 보내는 중…'
          : sent
            ? '호감을 보냈어요 · 답변 대기 중'
            : !inToday
              ? '오늘의 추천에서 만날 수 있어요'
              : remaining <= 0
                ? '오늘의 좋아요를 모두 사용했어요'
                : '나도 좋아요'
      }
      onBack={() => navigate('/likes')}
      onSafety={() => openSheet({ kind: 'safety', id: profile.id })}
      onChat={() => navigate(`/chat/${profile.id}`)}
      onAccept={async () => {
        if (pending || sent || !inToday || remaining <= 0) return;
        setPending(true);
        try {
          if (await like(profile)) {
            toast(`${profile.name}님과 마음이 통했어요. 첫 인사를 건네보세요!`);
            navigate(`/chat/${profile.id}`);
          } else toast('호감을 보냈어요. 서로의 마음이 닿으면 대화가 열려요.');
        } catch (err) {
          toast((err as Error).message);
        } finally {
          setPending(false);
        }
      }}
    />
  );
};
export default LikeDetailPage;
