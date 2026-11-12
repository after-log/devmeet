import { Download, Share, X } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import type { usePwaInstall } from '../hooks/usePwaInstall';

type InstallState = ReturnType<typeof usePwaInstall>;

export const PwaInstallButton = ({ state }: { state: InstallState }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (state.installed) return null;

  const install = async () => {
    if (!state.canPrompt) {
      setOpen(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await state.install();
      setOpen(false);
    } catch {
      setError('설치 창을 열지 못했어요. 브라우저 메뉴에서 다시 시도해 주세요.');
      setOpen(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs whitespace-nowrap text-point hover:bg-selected disabled:opacity-50"
        onClick={() => void install()}
        disabled={busy}
        aria-label="devmeet 앱 설치"
      >
        <Download size={15} aria-hidden="true" />앱 설치
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <img src="/icons/icon-192.png" alt="" className="mb-4 size-14 rounded-xl" />
          <DialogTitle>홈 화면에서 바로 만나요</DialogTitle>
          <DialogDescription className="mt-3">
            devmeet을 앱으로 추가하면 홈 화면에서 바로 열 수 있어요.
          </DialogDescription>
          {state.ios ? (
            <ol className="my-5 list-decimal space-y-3 pl-5 text-sm text-fg-2">
              <li>Safari에서 devmeet을 열어 주세요.</li>
              <li>
                <Share className="inline size-4" aria-hidden="true" /> 공유 메뉴를 열어 주세요.
              </li>
              <li>
                <strong>홈 화면에 추가</strong>를 선택하고 <strong>추가</strong>를 눌러 주세요.
              </li>
            </ol>
          ) : (
            <p className="my-5 text-sm text-fg-2">
              브라우저 주소창의 설치 아이콘이나 메뉴에서 <strong>앱 설치</strong> 또는{' '}
              <strong>홈 화면에 추가</strong>를 선택해 주세요. 메뉴가 보이지 않으면 Chrome이나
              Edge에서 열어 주세요.
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-orange">
              {error}
            </p>
          )}
          <button className="btn mt-4" onClick={() => setOpen(false)}>
            확인했어요
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const PwaInstallBanner = ({ state }: { state: InstallState }) => {
  if (!state.showBanner) return null;
  return (
    <aside
      aria-label="앱 설치 안내"
      className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3"
    >
      <img src="/icons/icon-192.png" alt="" className="size-10 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-xs font-semibold">devmeet을 홈 화면에 추가해 보세요</p>
      </div>
      <PwaInstallButton state={state} />
      <button
        onClick={state.dismiss}
        aria-label="설치 안내 하루 동안 닫기"
        title="하루 동안 닫기"
        className="grid min-h-10 min-w-8 place-items-center text-fg-3"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
};
