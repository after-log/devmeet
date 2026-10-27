import type { ChatRoom } from '@/types/chats';
import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, ArrowUpRight, Ellipsis, ShieldCheck } from 'lucide-react';
import { chatDate } from '@/data/chats';
import type { Person } from '@/types';
import { Avatar } from '@/components/PersonCard';
import ChatMessageBubble from './ChatMessageBubble';

const ChatThread = ({
  room,
  profile,
  onBack,
  onSend,
  onSafety,
  loading,
  error,
}: {
  room: ChatRoom;
  profile: Person;
  onBack: () => void;
  onSend: (message: string) => Promise<void>;
  onSafety: () => void;
  loading: boolean;
  error: string;
}) => {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [sendError, setSendError] = useState('');
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

  const send = async () => {
    if (!draft.trim() || sendingRef.current || loading) return;
    const text = draft.trim();
    sendingRef.current = true;
    setSending(true);
    setSendError('');
    try {
      await onSend(text);
      setDraft('');
      input.current?.focus();
    } catch (err) {
      setSendError(`전송 실패 · ${(err as Error).message} 입력 내용을 유지했어요.`);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
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
        <Avatar person={profile} size={40} />
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 text-base">{profile.name}</h2>
          <p className="m-0 truncate text-[11px] text-fg-4">
            {profile.job} · {profile.location}
          </p>
        </div>
        <button
          className="icon grid shrink-0 place-items-center"
          onClick={onSafety}
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
          서로의 마음이 연결되었어요.
        </p>
        <article className="profile mb-6 bg-surface">
          <div className="file-tab h-9">
            <span className="file-icon">&lt;/&gt;</span>our.common.ts
          </div>
          <div className="p-4">
            <p className="section-comment">// 대화의 시작이 될 상대의 관심사</p>
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
        {loading && (
          <p className="tip" role="status">
            대화를 불러오는 중…
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && room.messages.length === 0 && (
          <div className="py-7 text-center">
            <p className="font-mono text-lg text-green">hello, {profile.id}_</p>
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
        {sendError && (
          <p className="error" role="alert">
            {sendError}
          </p>
        )}
        <form
          className="chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <textarea
            ref={input}
            rows={2}
            readOnly={sending}
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
                void send();
              }
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending || loading}
            aria-label="메시지 보내기"
          >
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
    </section>
  );
};
export default ChatThread;
