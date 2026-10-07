import { useRef, useState } from 'react';
const ChatThread = ({
  messages,
  onBack,
  onSend,
  onSafety,
}: {
  messages: string[];
  onBack: () => void;
  onSend: (message: string) => void;
  onSafety: () => void;
}) => {
  const [draft, setDraft] = useState('');
  const input = useRef<HTMLInputElement>(null);

  return (
    <>
      <button className="back" onClick={onBack}>
        ← 대화 목록
      </button>
      <div className="listrow">
        <span className="small-avatar">MJ</span>
        <strong>
          민준 <span className="text-[#0099ff]">✓</span>
        </strong>
        <button className="icon" onClick={onSafety} aria-label="대화 안전 설정">
          ⋯
        </button>
      </div>
      <p className="tip">서로의 마음이 연결되었어요 · 오늘</p>
      <div className="panel">
        <p className="eyebrow">// first message</p>
        <p>둘 다 새로운 카페 찾기를 좋아해요.</p>
        <button
          className="pill"
          onClick={() => {
            setDraft('요즘 가장 좋았던 카페가 있나요?');
            input.current?.focus();
          }}
        >
          요즘 가장 좋았던 카페가 있나요? ↗
        </button>
      </div>
      <div id="messages" aria-live="polite">
        {messages.map((message, i) => (
          <div className="bubble mine" key={i}>
            {message}
          </div>
        ))}
      </div>
      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          onSend(draft.trim());
          setDraft('');
          input.current?.focus();
        }}
      >
        <input
          ref={input}
          aria-label="메시지"
          placeholder="부담 없이, 첫 인사를 건네세요"
          maxLength={1000}
          autoComplete="off"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button aria-label="메시지 보내기">↑</button>
      </form>
      <p className="tip">목업 대화예요. 실제 상대에게 전송되지 않아요.</p>
    </>
  );
};
export default ChatThread;
