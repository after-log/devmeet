import type { ChatRoom } from '@/types/chats';
import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, ArrowUpRight, Check, Ellipsis, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { chatDate } from '@/data/chats';
import type { Profile } from '@/types';
import ChatMessageBubble from './ChatMessageBubble';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const ChatThread = ({
  room,
  profile,
  onBack,
  onSend,
  onDisconnect,
}: {
  room: ChatRoom;
  profile: Profile;
  onBack: () => void;
  onSend: (message: string) => void;
  onDisconnect: () => void;
}) => {
  const [draft, setDraft] = useState('');
  const [safetyOpen, setSafetyOpen] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const [showLatest, setShowLatest] = useState(false);
  const scrollToLatest = () => {
    const area = scrollArea.current;
    if (area) area.scrollTop = area.scrollHeight;
    setShowLatest(false);
  };
  useEffect(() => {
    scrollToLatest();
  }, [room.messages.length]);

  const send = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
    input.current?.focus();
  };

  return (
    <section className="chat-thread" aria-label={`${profile.name}님과의 대화`}>
      <header className="flex shrink-0 items-center gap-3 border-b border-line pb-4">
        <button
          onClick={onBack}
          className="grid size-9 shrink-0 place-items-center rounded-md text-fg-3 hover:bg-lift"
          aria-label="대화 목록으로 돌아가기"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="small-avatar size-10 text-xs">{profile.initial}</span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 text-base">
            {profile.name}
            <Check size={13} className="text-green" aria-label="인증 완료" />
          </h2>
          <p className="m-0 truncate text-[11px] text-fg-4">
            {profile.job} · {profile.place}
          </p>
        </div>
        <button
          className="icon grid shrink-0 place-items-center"
          onClick={() => setSafetyOpen(true)}
          aria-label="대화 안전 설정"
        >
          <Ellipsis size={21} />
        </button>
      </header>
      <div
        ref={scrollArea}
        className="chat-history"
        onScroll={() => {
          const area = scrollArea.current;
          if (area) setShowLatest(area.scrollHeight - area.scrollTop - area.clientHeight > 100);
        }}
      >
        <p className="tip my-5">
          <span className="text-green">{'{ connected }'}</span>
          <br />
          {chatDate(room.matchedAt)} · 서로의 마음이 연결되었어요.
        </p>
        <article className="profile mb-6 bg-surface">
          <div className="file-tab h-9">
            <span className="file-icon">&lt;/&gt;</span>our.common.ts
          </div>
          <div className="p-4">
            <p className="section-comment">// 대화의 시작이 될 공통 관심사</p>
            <div className="flex flex-wrap gap-2">
              {room.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded border border-tag-green px-2 py-1 text-[11px] text-green"
                >
                  {interest}
                </span>
              ))}
            </div>
            <button
              className="mt-4 flex w-full items-center justify-between gap-2 text-left text-xs leading-[1.8] text-fg-2 hover:text-blue"
              onClick={() => {
                setDraft(room.starter);
                input.current?.focus();
              }}
            >
              {room.starter}
              <ArrowUpRight size={15} className="shrink-0 text-blue" />
            </button>
          </div>
        </article>
        {room.messages.length === 0 && (
          <div className="py-7 text-center">
            <p className="font-mono text-lg text-green">hello, {profile.initial.toLowerCase()}_</p>
            <p className="text-xs leading-7 text-fg-4">
              거창한 인사가 아니어도 괜찮아요.
              <br />
              관심사 하나로 이야기를 시작해 보세요.
            </p>
          </div>
        )}
        <div role="log" aria-label="메시지" aria-live="polite" aria-relevant="additions">
          {room.messages.map((message, index) => {
            const previous = room.messages[index - 1];
            const newDay =
              !previous ||
              new Date(previous.sentAt).toDateString() !== new Date(message.sentAt).toDateString();
            return (
              <Fragment key={message.id}>
                {newDay && (
                  <div className="chat-date">
                    <span>{chatDate(message.sentAt)}</span>
                  </div>
                )}
                <ChatMessageBubble message={message} profile={profile} />
              </Fragment>
            );
          })}
        </div>
      </div>
      {showLatest && (
        <button className="chat-latest" onClick={scrollToLatest}>
          최근 메시지로 이동 ↓
        </button>
      )}
      <footer className="shrink-0 border-t border-line pt-3 pb-[max(8px,env(safe-area-inset-bottom))]">
        <form
          className="chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <textarea
            ref={input}
            rows={2}
            aria-label="메시지"
            placeholder="편하게 이야기를 건네보세요"
            maxLength={1000}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.keyCode !== 229
              ) {
                event.preventDefault();
                send();
              }
            }}
          />
          <button type="submit" disabled={!draft.trim()} aria-label="메시지 보내기">
            <ArrowUp size={18} />
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-fg-4">
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} />
            목업 대화 · 실제 상대에게 전송되지 않아요
          </span>
          <span className="font-mono">{draft.length}/1000</span>
        </div>
      </footer>
      <Dialog open={safetyOpen} onOpenChange={setSafetyOpen}>
        <DialogContent>
          <DialogTitle>{profile.name}님과의 대화 설정</DialogTitle>
          <DialogDescription>
            개인 연락처와 금융 정보는 신중하게 공유해 주세요. 연결을 해제하면 이 목업 대화가
            목록에서 사라져요.
          </DialogDescription>
          <button
            className="btn secondary full"
            onClick={() => {
              toast('목업 화면에서는 실제 신고가 접수되지 않아요.');
              setSafetyOpen(false);
            }}
          >
            신고하기
          </button>
          <button className="btn full" onClick={onDisconnect}>
            대화 연결 해제
          </button>
        </DialogContent>
      </Dialog>
    </section>
  );
};
export default ChatThread;
