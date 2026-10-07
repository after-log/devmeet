import { DialogTitle, DialogDescription } from '../ui/dialog';

const SafetyDialog = ({
  onReport,
  onDisconnect,
}: {
  onReport: () => void;
  onDisconnect: () => void;
}) => (
  <>
    <DialogTitle>안전한 대화를 위해</DialogTitle>
    <DialogDescription>개인 연락처와 금융 정보는 신중하게 공유해 주세요.</DialogDescription>
    <button className="btn secondary full" onClick={onReport}>
      신고하기
    </button>
    <button className="btn full" onClick={onDisconnect}>
      대화 연결 해제
    </button>
  </>
);
export default SafetyDialog;
