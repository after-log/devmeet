import { useRef } from 'react';
import { useSchemaForm } from '@/hooks/useSchemaForm';
import { setFormError } from '@/hooks/setFormError';
import { workEmailRequestSchema } from '@/validation/companyEmail';
import { useWorkEmailMutations } from '@/hooks/queries/useWorkEmail';
import type { WorkEmailStatus } from '@/lib/workEmail';
import { FormErrors } from './ui/form-errors';

export default function WorkEmailRequestForm({
  status,
  disabled,
  resendSeconds,
  onBusyChange,
  onComplete,
}: {
  status: WorkEmailStatus;
  disabled: boolean;
  resendSeconds: number;
  onBusyChange: (busy: boolean) => void;
  onComplete: (status: WorkEmailStatus) => void;
}) {
  const emailMutations = useWorkEmailMutations();
  const form = useSchemaForm(workEmailRequestSchema, {
    values: {
      company: status.pending?.company ?? status.verified?.company ?? '',
      email: status.pending?.email ?? status.verified?.email ?? '',
    },
  });
  const inFlight = useRef(false);
  const busy = disabled || form.formState.isSubmitting;
  const submit = form.handleSubmit(async (input) => {
    if (inFlight.current || disabled || resendSeconds > 0) return;
    inFlight.current = true;
    onBusyChange(true);
    form.clearErrors('root');
    try {
      onComplete(await emailMutations.send(input));
    } catch (error) {
      setFormError(form.setError, error);
    } finally {
      inFlight.current = false;
      onBusyChange(false);
    }
  });
  return (
    <form noValidate onSubmit={submit} className="space-y-3">
      <fieldset disabled={busy} className="m-0 min-w-0 space-y-3 border-0 p-0">
        <label className="formlabel" htmlFor="work-company">
          회사명
        </label>
        <input
          id="work-company"
          {...form.register('company')}
          maxLength={100}
          autoComplete="organization"
        />
        <label className="formlabel" htmlFor="work-email">
          회사 이메일
        </label>
        <input
          id="work-email"
          type="email"
          {...form.register('email')}
          maxLength={254}
          autoComplete="email"
          placeholder="name@company.com"
        />
        <button className="btn secondary full" disabled={busy || resendSeconds > 0}>
          {resendSeconds > 0
            ? `${resendSeconds}초 후 다시 받기`
            : status.pending
              ? '인증번호 다시 받기'
              : '인증번호 받기'}
        </button>
      </fieldset>
      <FormErrors errors={form.formState.errors} />
    </form>
  );
}
