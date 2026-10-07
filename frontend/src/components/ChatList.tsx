const ChatList = ({
  matched,
  messages,
  onOpen,
  onDiscover,
}: {
  matched: boolean;
  messages: string[];
  onOpen: () => void;
  onDiscover: () => void;
}) => {
  return (
    <>
      <p className="eyebrow">// messages</p>
      <h2>대화</h2>
      <p className="intro">서로 호감을 보낸 사람과 대화해요.</p>
      {matched ? (
        <button className="listrow" onClick={onOpen}>
          <span className="small-avatar">MJ</span>
          <span>
            <strong>
              민준 <span className="text-[#0099ff]">✓</span>
            </strong>
            <small>
              {messages.length ? '보낸 메시지가 있어요' : '마음이 통했어요. 첫 인사를 건네보세요.'}
            </small>
          </span>
          <time>NEW</time>
        </button>
      ) : (
        <div className="empty">
          <div className="big">{'{ hi }'}</div>
          <h3>아직은, 첫 인사 전</h3>
          <p>
            서로 호감을 보내면
            <br />
            이곳에서 대화를 나눌 수 있어요.
          </p>
          <button className="btn full" onClick={onDiscover}>
            인연 만나러 가기
          </button>
        </div>
      )}
    </>
  );
};
export default ChatList;
