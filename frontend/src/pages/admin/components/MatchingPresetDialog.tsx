import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AdminButton, AdminSurface, IconButton } from './AdminUI';
import type { MatchingPreset } from '../types';

export default function MatchingPresetDialog({
  action,
  preset,
  busy,
  error,
  close,
  confirm,
  restoreFocus,
}: {
  action: 'apply' | 'delete';
  preset: MatchingPreset;
  busy: boolean;
  error: string;
  close: () => void;
  confirm: () => void;
  restoreFocus: () => void;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  const deleting = action === 'delete';
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-[#17171770] backdrop-blur-sm" />
        <Dialog.Content
          role="alertdialog"
          aria-busy={busy}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancel.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault();
          }}
          className="fixed top-1/2 left-1/2 z-71 max-h-[90dvh] w-[calc(100%-36px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[15px] bg-white p-6 shadow-[0_24px_100px_#17171730]"
        >
          <AdminSurface>
            <div className="mb-4 flex items-start justify-between gap-3">
              <Dialog.Title className="text-lg font-semibold">
                프리셋을 {deleting ? '삭제' : '적용'}할까요?
              </Dialog.Title>
              <Dialog.Close asChild>
                <IconButton aria-label="닫기" disabled={busy}>
                  <X size={18} />
                </IconButton>
              </Dialog.Close>
            </div>
            <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-semibold">
                {preset.name}{' '}
                <span className="font-normal text-neutral-500">v{preset.version}</span>
              </p>
              {!deleting && (
                <p className="mt-2! text-xs text-neutral-600">
                  {preset.legacyScoring
                    ? '만남 20점 · 연락 20점 · 가치관 일치 문항당 1점'
                    : `가치관 ${preset.valuesWeight}% · 만남 ${preset.meetingWeight}% · 연락 ${preset.contactWeight}%`}
                </p>
              )}
            </div>
            <Dialog.Description className="text-sm leading-relaxed text-neutral-600">
              {deleting
                ? '이 버전을 프리셋 보관함에서 삭제합니다. 다른 버전과 과거 추천·성과 기록은 유지되며, 삭제한 버전은 다시 적용할 수 없습니다.'
                : '전체 회원의 새로 생성되는 추천부터 적용됩니다. 오늘 이미 배정된 상대와 기존 좋아요·매칭은 유지됩니다.'}
            </Dialog.Description>
            {error && (
              <p
                role="alert"
                className="mt-4! rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancel}
                type="button"
                disabled={busy}
                onClick={close}
                className="min-h-11 rounded-[7px] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                취소
              </button>
              <AdminButton
                variant={deleting ? 'danger' : 'primary'}
                disabled={busy}
                onClick={confirm}
              >
                {busy ? '처리 중…' : deleting ? '삭제' : '적용'}
              </AdminButton>
            </div>
          </AdminSurface>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
