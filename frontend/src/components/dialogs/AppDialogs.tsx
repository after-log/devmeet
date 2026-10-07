import { useNavigate } from 'react-router-dom';
import { useDevmeetStore } from '../../stores/devmeet';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '../ui/dialog';
import MatchDialog from './MatchDialog';
import FiltersDialog from './FiltersDialog';
import SafetyDialog from './SafetyDialog';

const AppDialogs = () => {
  const navigate = useNavigate();
  const {
    modal,
    setModal,
    setIndex,
    draftFilter,
    setDraftFilter,
    setFilter,
    setMatched,
    setMessages,
  } = useDevmeetStore(
    useShallow((s) => ({
      modal: s.modal,
      setModal: s.setModal,
      setIndex: s.setIndex,
      draftFilter: s.draftFilter,
      setDraftFilter: s.setDraftFilter,
      setFilter: s.setFilter,
      setMatched: s.setMatched,
      setMessages: s.setMessages,
    })),
  );
  const notify = (message: string) => {
    toast(message);
  };
  const close = () => setModal(null);
  return (
    <Dialog
      open={modal !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent>
        {modal === 'match' && (
          <MatchDialog
            onChat={() => {
              close();
              navigate('/chat/MJ');
            }}
            onContinue={() => {
              close();
              setIndex((previous) => previous + 1);
            }}
          />
        )}
        {modal === 'filters' && (
          <FiltersDialog
            filter={draftFilter}
            onChange={setDraftFilter}
            onApply={() => {
              setFilter(draftFilter);
              setIndex(0);
              close();
              navigate('/discover');
              notify('추천 조건을 적용했어요');
            }}
          />
        )}
        {modal === 'safety' && (
          <SafetyDialog
            onReport={() => {
              close();
              notify('목업: 신고가 접수되었어요');
            }}
            onDisconnect={() => {
              setMatched(false);
              setMessages([]);
              close();
              navigate('/chat');
              notify('대화 연결을 해제했어요');
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
export default AppDialogs;
