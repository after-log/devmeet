import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import AdminFormDialog from '../components/AdminFormDialog';
import { AdminButton, Field, TextArea } from '../components/AdminUI';

export type CompanyEmailDialogCallbacks = {
  close: () => void;
  saved: () => void;
  restoreFocus: () => void;
};
export default function CompanyEmailActionDialog({
  title,
  description,
  submitLabel,
  danger = false,
  onSubmit,
  close,
  saved,
  restoreFocus,
  children,
}: CompanyEmailDialogCallbacks & {
  title: string;
  description: string;
  submitLabel?: string;
  danger?: boolean;
  onSubmit?: (note: string) => Promise<void>;
  children: ReactNode;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const inFlight = useRef(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!onSubmit || !note.trim() || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await onSubmit(note.trim());
      saved();
    } catch (error) {
      setError(error instanceof Error ? error.message : '요청을 처리하지 못했어요.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const dismiss = () => {
    if (!inFlight.current) close();
  };
  return (
    <AdminFormDialog
      title={title}
      description={description}
      busy={busy}
      heading={heading}
      close={dismiss}
      restoreFocus={restoreFocus}
    >
      <form className="p-6" onSubmit={(event) => void submit(event)}>
        <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
          {children}
          {onSubmit && (
            <div className="mb-5">
              <Field label="검토 근거 / 처리 사유">
                <TextArea
                  required
                  maxLength={1000}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="확인한 근거 또는 보완이 필요한 내용을 작성해 주세요. 회원에게 처리 사유가 표시됩니다."
                />
              </Field>
            </div>
          )}
          {error && (
            <p role="alert" className="mb-4! rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
            <AdminButton disabled={busy} onClick={dismiss}>
              닫기
            </AdminButton>
            {onSubmit && (
              <AdminButton
                type="submit"
                variant={danger ? 'danger' : 'primary'}
                disabled={busy || !note.trim()}
              >
                {busy ? '처리 중…' : submitLabel}
              </AdminButton>
            )}
          </div>
        </fieldset>
      </form>
    </AdminFormDialog>
  );
}
