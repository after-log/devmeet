import { useRef, type ReactNode } from 'react';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import AdminFormDialog from '../components/AdminFormDialog';
import { AdminButton, Field, TextArea } from '../components/AdminUI';
import { FormErrors } from '@/components/ui/form-errors';
import { setFormError } from '@/hooks/setFormError';

export type CompanyEmailDialogCallbacks = {
  close: () => void;
  saved: () => void;
  restoreFocus: () => void;
};
export default function CompanyEmailActionDialog<
  Input extends FieldValues,
  Output extends FieldValues,
>({
  title,
  description,
  submitLabel,
  danger = false,
  form,
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
  form: UseFormReturn<Input, unknown, Output>;
  onSubmit?: (input: Output) => Promise<void>;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const inFlight = useRef(false);
  const busy = form.formState.isSubmitting;
  const submit = async (input: Output) => {
    if (!onSubmit || inFlight.current) return;
    inFlight.current = true;
    form.clearErrors('root');
    try {
      await onSubmit(input);
      saved();
    } catch (error) {
      setFormError(form.setError, error);
    } finally {
      inFlight.current = false;
    }
  };
  const dismiss = () => {
    if (!busy && !inFlight.current) close();
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
      <form
        noValidate
        className="p-6"
        onSubmit={onSubmit ? form.handleSubmit(submit) : (event) => event.preventDefault()}
      >
        <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
          {children}
          {onSubmit && (
            <div className="mb-5">
              <Field label="검토 근거 / 처리 사유">
                <TextArea
                  maxLength={1000}
                  {...form.register('note' as FieldPath<Input>)}
                  placeholder="확인한 근거 또는 보완이 필요한 내용을 작성해 주세요. 회원에게 처리 사유가 표시됩니다."
                />
              </Field>
            </div>
          )}
          <FormErrors
            errors={form.formState.errors}
            className="mb-4! rounded-lg bg-red-50 p-3 text-sm text-red-800"
          />
          <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
            <AdminButton disabled={busy} onClick={dismiss}>
              닫기
            </AdminButton>
            {onSubmit && (
              <AdminButton type="submit" variant={danger ? 'danger' : 'primary'} disabled={busy}>
                {busy ? '처리 중…' : submitLabel}
              </AdminButton>
            )}
          </div>
        </fieldset>
      </form>
    </AdminFormDialog>
  );
}
