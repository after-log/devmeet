import { useRef } from 'react';
import { useSchemaForm } from '@/hooks/useSchemaForm';
import { workEmailCodeSchema } from '@/validation/companyEmail';
import { formErrorMessage } from '@/validation/forms';
import { request } from '@/lib/api';
import type { WorkEmailStatus } from '@/lib/workEmail';
import { FormErrors } from './ui/form-errors';

export default function WorkEmailCodeForm({
  pending,
  expired,
  disabled,
  onBusyChange,
  onComplete,
  onRefresh,
  onError,
}: {
  pending: NonNullable<WorkEmailStatus['pending']>;
  expired: boolean;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onComplete: (status: WorkEmailStatus) => void;
  onRefresh: (status: WorkEmailStatus) => void;
  onError: (message: string) => void;
}) {
  const form = useSchemaForm(workEmailCodeSchema, { defaultValues: { code: '' } });
  const inFlight = useRef(false);
  const busy = disabled || form.formState.isSubmitting;
  const submit = form.handleSubmit(async (input) => {
    if (inFlight.current || disabled || expired) return;
    inFlight.current = true;
    onBusyChange(true);
    onError('');
    try {
      onComplete(await request<WorkEmailStatus>('/work-email/verify', 'POST', input));
    } catch (error) {
      onError(formErrorMessage(error));
      try {
        onRefresh(await request<WorkEmailStatus>('/work-email'));
      } catch {
        /* Preserve verification error. */
      }
    } finally {
      inFlight.current = false;
      onBusyChange(false);
    }
  });
  return (
    <form noValidate className="mt-4 space-y-3" onSubmit={submit}>
      <p className="text-xs break-all text-fg-3">인증번호를 보낸 주소: {pending.email}</p>
      <fieldset disabled={busy || expired} className="m-0 min-w-0 space-y-3 border-0 p-0">
        <label className="formlabel" htmlFor="work-email-code">
          인증번호 6자리
        </label>
        <input
          id="work-email-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          {...form.register('code')}
          maxLength={6}
        />
        {expired && (
          <p className="text-xs text-sub">인증번호가 만료됐어요. 새 번호를 받아 주세요.</p>
        )}
        <button className="btn full" disabled={busy || expired}>
          이메일 확인하기
        </button>
      </fieldset>
      <FormErrors errors={form.formState.errors} />
    </form>
  );
}
