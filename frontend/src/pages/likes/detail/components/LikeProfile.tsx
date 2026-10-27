import { ArrowLeft, Check, Heart, MessageSquare } from 'lucide-react';
import type { Profile } from '@/types';
import type { LikeEntry } from '@/types/likes';
import { chatDate } from '@/data/chats';

interface LikeProfileProps {
  profile: Profile;
  entry: LikeEntry;
  matched: boolean;
  onBack: () => void;
  onChat: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}

const LikeProfile = ({
  profile,
  entry,
  matched,
  onBack,
  onChat,
  onAccept,
  onDismiss,
}: LikeProfileProps) => (
  <>
    <button className="back flex items-center gap-2" onClick={onBack}>
      <ArrowLeft size={16} />
      호감 목록
    </button>
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
        {profile.initial.toLowerCase()}.profile.ts
        <Heart size={14} className="ml-auto text-purple" />
      </div>
      <div className="profile-heading">
        <div className="min-w-0">
          <div className="profile-name">
            {profile.name}
            <span>{profile.age}</span>
            <Check size={15} className="text-green" aria-label="인증 완료" />
          </div>
          <p>
            {profile.job} <span>· {profile.place}</span>
          </p>
        </div>
        <div className="initial-box">
          {profile.initial}
          <span>_</span>
        </div>
      </div>
      <div className="code-block" aria-label="프로필 정보">
        <div className="code-line">
          <i>01</i>
          <code>
            <span className="keyword">const</span>{' '}
            <span className="variable">{profile.initial.toLowerCase()}</span>
            {' = {'}
          </code>
        </div>
        <div className="code-line">
          <i>02</i>
          <code>
            {'  afterWork: '}
            <span className="string">{JSON.stringify(profile.afterWork)}</span>,
          </code>
        </div>
        <div className="code-line">
          <i>03</i>
          <code>
            {'  lookingFor: '}
            <span className="string">"진지한 관계"</span>,
          </code>
        </div>
        <div className="code-line">
          <i>04</i>
          <code>
            {'  verified: '}
            <span className="keyword">true</span>
          </code>
        </div>
        <div className="code-line">
          <i>05</i>
          <code>{'};'}</code>
        </div>
      </div>
      <div className="profile-body">
        <p className="section-comment">// about me</p>
        <p className="bio">{profile.bio}</p>
        <div className="chips mt-4">
          {profile.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="reason">
          <div className="reason-top">
            <span>함께 맞는 점</span>
            <b>
              {profile.score}
              <small>%</small>
            </b>
          </div>
          <p>{profile.reason}</p>
        </div>
        <div className="verified">
          <span>✓</span>
          {/개발|엔지니어/.test(profile.job) ? '회사 이메일 · GitHub 인증' : '회사 이메일 인증'}
        </div>
      </div>
    </article>
    {matched ? (
      <button className="btn full flex items-center justify-center gap-2" onClick={onChat}>
        <MessageSquare size={16} />
        대화 이어가기
      </button>
    ) : entry.direction === 'received' ? (
      <div className="mt-[18px] grid grid-cols-[1fr_1.5fr] gap-[10px]">
        <button className="btn secondary" onClick={onDismiss}>
          넘어가기
        </button>
        <button className="btn flex items-center justify-center gap-2" onClick={onAccept}>
          <Heart size={16} />
          나도 좋아요
        </button>
      </div>
    ) : (
      <button className="btn secondary full" disabled>
        호감을 보냈어요 · 답변 대기 중
      </button>
    )}
    <p className="footnote">
      {entry.likedAt ? `${chatDate(entry.likedAt)} · ` : ''}
      {matched ? '서로 호감을 보내 대화가 열렸어요.' : '서로 좋아요를 보내면 대화가 열려요.'}
    </p>
    <p className="footnote">목업 화면이에요. 실제 상대에게 전달되지 않아요.</p>
  </>
);
export default LikeProfile;
