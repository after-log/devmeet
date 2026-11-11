import type { ChatRoom } from '@/types/chats';
import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { chatDate } from '@/data/chats';
import type { Person } from '@/types';
import ChatMessageBubble from './ChatMessageBubble';
import PixelPlane from '@/components/pixel/PixelPlane';

const ChatThread = ({
  room,
  profile,
  onSend,
  loading,
  error,
  hasOlder,
  onLoadOlder,
}: {
  room: ChatRoom;
  profile: Person;
  onSend: (message: string) => Promise<void>;
  loading: boolean;
  error: string;
  hasOlder: boolean;
  onLoadOlder: () => Promise<void>;
}) => {
  const [draft, setDraft] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const preserveScroll = useRef(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [sendError, setSendError] = useState('');
  const [plane, setPlane] = useState(0);
  const input = useRef<HTMLTextAreaElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const [showLatest, setShowLatest] = useState(false);
  const scrollToLatest = () => {
    const area = scrollArea.current;
    if (area) area.scrollTop = area.scrollHeight;
    setShowLatest(false);
  };
  useEffect(() => {
    if (preserveScroll.current) {
      preserveScroll.current = false;
      return;
    }
    scrollToLatest();
  }, [room.messages.length]);

  const send = async () => {
    if (!draft.trim() || sendingRef.current || loading) return;
    const text = draft.trim();
    // 대화방의 첫 메시지일 때만 종이비행기를 띄운다
    const first = room.messages.length === 0;
    sendingRef.current = true;
    setSending(true);
    setSendError('');
    try {
      await onSend(text);
      if (first) setPlane((n) => n + 1);
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
      <div
        ref={scrollArea}
        className="chat-history"
        onScroll={() => {
          const area = scrollArea.current;
          if (area) setShowLatest(area.scrollHeight - area.scrollTop - area.clientHeight > 100);
        }}
      >
        {hasOlder && (
          <button
            className="btn secondary full my-4"
            disabled={loadingOlder}
            onClick={async () => {
              setLoadingOlder(true);
              setSendError('');
              const area = scrollArea.current;
              const before = area?.scrollHeight ?? 0;
              preserveScroll.current = true;
              try {
                await onLoadOlder();
                requestAnimationFrame(() => {
                  if (area) area.scrollTop += area.scrollHeight - before;
                });
              } catch (err) {
                setSendError((err as Error).message);
                preserveScroll.current = false;
              } finally {
                setLoadingOlder(false);
              }
            }}
          >
            {loadingOlder ? '불러오는 중…' : '이전 대화 불러오기'}
          </button>
        )}
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
      <footer className="relative shrink-0 border-t border-line pt-3 pb-[max(8px,env(safe-area-inset-bottom))]">
        <PixelPlane trigger={plane} />
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
