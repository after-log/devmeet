import { Check, Heart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '@/stores/app';
import type { Person } from '@/types';
import PixelHeartPop from './pixel/PixelHeartPop';
import PixelLoader from './pixel/PixelLoader';

/**
 * 좋아요 버튼. 누르면 서버 응답을 기다리는 동안 픽셀 로더를 보여 주고(중복 전송 방지),
 * 보내지면 픽셀 하트 팝을 한 번 재생한다. 매칭이면 하트를 보여 준 뒤 매칭 화면으로 간다.
 */
const LikeButton = ({
  person,
  disabled = false,
  className = 'btn',
  label,
}: {
  person: Person;
  disabled?: boolean;
  className?: string;
  label?: string;
}) => {
  const navigate = useNavigate();
  const { liked, remaining, like, user } = useApp();
  const [pending, setPending] = useState(false);
  const [pop, setPop] = useState(0);
  const sent = liked.includes(person.id);
  const dev = (user?.profile?.role ?? 'developer') === 'developer';
  const text = label ?? (dev ? 'LGTM! · 좋아요' : '좋아요');

  return (
    <span className="like-wrap">
      <PixelHeartPop trigger={pop} />
      <button
        className={`${className} w-full`}
        disabled={disabled || sent || pending || remaining <= 0}
        aria-busy={pending}
        onClick={async () => {
          if (pending) return;
          setPending(true);
          try {
            const matched = await like(person);
            setPop((n) => n + 1);
            if (matched) setTimeout(() => navigate(`/match/${person.id}`), 380);
            else toast('좋아요를 보냈어요. 서로의 마음이 닿으면 알려드려요.');
          } catch (err) {
            toast((err as Error).message);
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? (
          <PixelLoader />
        ) : sent ? (
          <>
            <Check className="ico" aria-hidden="true" /> 보냈어요
          </>
        ) : (
          <>
            <Heart className="ico" fill="currentColor" aria-hidden="true" /> {text}
          </>
        )}
      </button>
    </span>
  );
};
export default LikeButton;
