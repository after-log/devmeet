import { useRegisterSW } from 'virtual:pwa-register/react';

const PwaUpdate = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;
  return (
    <aside
      aria-label="앱 업데이트"
      className="fixed inset-x-4 bottom-28 z-40 mx-auto max-w-[448px] rounded-lg border border-line-strong bg-surface p-4 shadow-lg"
    >
      <p role="status" className="m-0 text-sm">
        새 버전이 준비됐어요.
      </p>
      <p className="mt-1 text-xs text-fg-3">작성 중인 내용을 저장한 뒤 업데이트해 주세요.</p>
      <div className="flex justify-end gap-4 text-xs">
        <button onClick={() => setNeedRefresh(false)} className="min-h-10 text-fg-3">
          나중에
        </button>
        <button onClick={() => void updateServiceWorker(true)} className="min-h-10 text-blue">
          업데이트
        </button>
      </div>
    </aside>
  );
};

export default PwaUpdate;
