import { ArrowLeft, Ellipsis, Heart, MessageSquare } from 'lucide-react';
import type { Person } from '@/types';
import type { LikeEntry } from '@/types/likes';
import { CodeLines, personLines } from '@/components/PersonCard';

interface LikeProfileProps {
  profile: Person;
  entry: LikeEntry;
  matched: boolean;
  demo: boolean;
  reason: string;
  canAccept: boolean;
  acceptLabel: string;
  onBack: () => void;
  onSafety: () => void;
  onChat: () => void;
  onAccept: () => Promise<void>;
}

const LikeProfile = ({
  profile,
  entry,
  matched,
  demo,
  reason,
  canAccept,
  acceptLabel,
  onBack,
  onSafety,
  onChat,
  onAccept,
}: LikeProfileProps) => (
  <>
    <div className="flex items-center justify-between">
      <button className="back flex items-center gap-2" onClick={onBack}>
        <ArrowLeft size={16} />
        호감 목록
      </button>
      <button className="icon grid place-items-center" aria-label="프로필 메뉴" onClick={onSafety}>
        <Ellipsis size={20} />
      </button>
    </div>
    <p className="eyebrow mt-3">
      // {entry.direction === 'received' ? 'someone likes you' : 'a little courage'}
    </p>
    <h2>
      {matched
        ? '서로의 마음이 닿았어요'
        : entry.direction === 'received'
          ? '나에게 도착한 호감'
          : '내가 보낸 마음'}
      <span className="syntax">.</span>
    </h2>
    <p className="intro">
      {matched
        ? '이제 두 사람의 이야기를 시작해 볼까요?'
        : entry.direction === 'received'
          ? `${profile.name}님이 당신을 더 알아가고 싶어 해요.`
          : `${profile.name}님에게 호감을 보냈어요. 답변을 기다려 주세요.`}
    </p>
    <article className="profile">
      <div className="file-tab">
        <span className="file-icon">ts</span>
        {profile.name}.profile.ts
        <Heart size={14} className="ml-auto text-purple" />
      </div>
      <img className="detail-photo" src={profile.photo} alt={`${profile.name} 프로필 사진`} />
      <div className="profile-heading">
        <div className="min-w-0">
          <div className="profile-name">
            {profile.name}
            <span>{profile.age}</span>
          </div>
          <p>
            {profile.job} <span>· {profile.location}</span>
          </p>
        </div>
        <span className="tag">{demo ? '가상 프로필' : '인증 전'}</span>
      </div>
      <CodeLines lines={personLines(profile, profile.id)} />
      <div className="profile-body">
        <p className="section-comment">// about me</p>
        <p className="bio whitespace-pre-wrap">{profile.intro}</p>
        <div className="chips mt-4">
          {profile.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="reason">
          <div className="reason-top">
            <span>함께 맞는 점</span>
          </div>
          <p>{reason}</p>
        </div>
        <div className="verified">{demo ? '가상 프로필' : '본인 입력 정보 · 인증 전'}</div>
      </div>
    </article>
    {matched ? (
      <button className="btn full flex items-center justify-center gap-2" onClick={onChat}>
        <MessageSquare size={16} />
        대화 이어가기
      </button>
    ) : entry.direction === 'received' ? (
      <>
        <div className="mt-[18px] grid grid-cols-[1fr_1.5fr] gap-[10px]">
          <button className="btn secondary" onClick={onBack}>
            돌아가기
          </button>
          <button
            className="btn flex items-center justify-center gap-2"
            disabled={!canAccept}
            onClick={() => void onAccept()}
          >
            <Heart size={16} />
            나도 좋아요
          </button>
        </div>
        {!canAccept && (
          <p className="footnote" role="status">
            {acceptLabel}
          </p>
        )}
      </>
    ) : (
      <button className="btn secondary full" disabled>
        호감을 보냈어요 · 답변 대기 중
      </button>
    )}
    <p className="footnote">서로 좋아요를 보내면 대화가 열려요. · 하루 최대 3회</p>
    <p className="footnote">목업 화면이에요. 실제 상대에게 전달되지 않아요.</p>
  </>
);
export default LikeProfile;
