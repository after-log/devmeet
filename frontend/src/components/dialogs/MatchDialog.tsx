import { DialogTitle, DialogDescription } from '../ui/dialog';

const MatchDialog = ({ onChat, onContinue }: { onChat: () => void; onContinue: () => void }) => (
  <>
    <p className="eyebrow">// connection established</p>
    <div className="gradient-title">match = true;</div>
    <DialogTitle>민준님과 마음이 통했어요.</DialogTitle>
    <DialogDescription>
      서로에게 호감을 보냈어요.
      <br />
      이제 두 사람의 이야기를 시작해 볼까요?
    </DialogDescription>
    <div className="panel">
      <span className="eyebrow">// shared interests</span>
      <p>☕ 새로운 카페 찾기 · 진지한 관계</p>
    </div>
    <button className="btn full" onClick={onChat}>
      첫 인사 보내기
    </button>
    <button className="btn secondary mt-[10px] w-full" onClick={onContinue}>
      조금 더 둘러보기
    </button>
  </>
);
export default MatchDialog;
