import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/mock-api';
import { useApp } from '../stores/app';
import { OPENERS } from '../data/options';
import { Avatar } from '../components/PersonCard';
import type { Message } from '../types';

const time = (t: number) =>
  new Date(t).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  });

const ChatPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { connections, demo, demoMessages, demoSend, openSheet, user } = useApp();
  const p = connections.matches.find((m) => m.id === id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!p || demo) return;
    api
      .messages(id)
      .then((r) => setMessages(r.messages))
      .catch((e) => setError((e as Error).message));
  }, [id, p, demo]);
  const list = demo ? (demoMessages[id] ?? []) : messages;
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [list.length]);

  if (!p) return <Navigate to="/chat" replace />;
  const mine = (m: Message) => m.sender === user?.id || m.sender === 'demo-me';
  return (
    <>
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <button className="back !mb-0" onClick={() => navigate('/chat')} aria-label="대화 목록으로">
          ←
        </button>
        <Avatar person={p} size={40} />
        <span className="min-w-0 flex-1">
          <strong className="block text-[14px] font-medium">{p.name}</strong>
          <small className="block font-mono text-[11px] text-fg-4">
            // merged · 상호 좋아요로 열린 대화
          </small>
        </span>
        <button
          className="icon !ml-0"
          onClick={() => openSheet({ kind: 'safety', id: p.id })}
          aria-label="대화 메뉴"
        >
          ⋯
        </button>
      </div>
      <div aria-live="polite">
        {list.length ? (
          list.map((m) => (
            <div key={m.id} className={mine(m) ? 'text-right' : ''}>
              <div className={`bubble inline-block text-left ${mine(m) ? 'mine' : ''}`}>
                {m.text}
              </div>
              <time className="block font-mono text-[10px] text-fg-4">{time(m.created)}</time>
            </div>
          ))
        ) : (
          <div className="empty !py-12">
            <div className="big">// first message</div>
            <h3>가볍게 인사해 보세요.</h3>
            <p>
              멋진 첫 문장이 아니어도 좋아요.
              <br />
              좋아하는 공간 이야기로 시작해 볼까요?
            </p>
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="suggestions">
        {OPENERS.map((s) => (
          <button
            key={s}
            className="pill"
            onClick={() => {
              setDraft(s);
              input.current?.focus();
            }}
          >
            {s} ↗
          </button>
        ))}
      </div>
      <form
        className="chat-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          setError('');
          try {
            if (demo) demoSend(id, text);
            else {
              const { message } = await api.send(id, text);
              setMessages((prev) => [...prev, message]);
            }
            setDraft('');
            input.current?.focus();
          } catch (err) {
            setError(`전송 실패 · ${(err as Error).message} 입력 내용을 유지했어요.`);
          }
        }}
      >
        <input
          ref={input}
          aria-label="메시지 입력"
          placeholder="메시지를 입력해 주세요"
          maxLength={1000}
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button aria-label="메시지 보내기" disabled={!draft.trim()}>
          ↑
        </button>
      </form>
      <p className="error" role="alert">
        {error}
      </p>
      <p className="tip">서버 연동 전이라 상대에게 실제로 전송되지 않아요. 자동 답장도 없어요.</p>
    </>
  );
};
export default ChatPage;
