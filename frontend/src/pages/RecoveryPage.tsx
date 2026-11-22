import { useState } from 'react';
import { useSchemaForm } from '@/hooks/useSchemaForm';
import { setFormError } from '@/hooks/setFormError';
import { recoveryFormSchema } from '@/validation/auth';
import { FormErrors } from '@/components/ui/form-errors';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useRecovery } from '@/hooks/queries/useRecovery';

export default function RecoveryPage() {
  const recovery = useRecovery();
  const { pathname } = useLocation();
  const [query] = useSearchParams();
  const verify = pathname.endsWith('/verify');
  const reset = pathname.endsWith('/reset');
  const mode = verify ? 'verify' : reset ? 'reset' : 'request';
  const form = useSchemaForm(recoveryFormSchema, {
    values: { mode, token: query.get('token') ?? '', email: '', password: '' },
  });
  const [message, setMessage] = useState('');
  const busy = form.formState.isSubmitting;
  return (
    <>
      <h2>{verify ? '이메일 확인' : reset ? '새 비밀번호' : '비밀번호 찾기'}</h2>
      <form
        noValidate
        onSubmit={form.handleSubmit(async (input) => {
          form.clearErrors('root');
          try {
            setMessage(await recovery.mutateAsync(input));
          } catch (error) {
            setFormError(form.setError, error);
          }
        })}
      >
        {!verify && (
          <label className="formlabel">
            {reset ? '새 비밀번호 · 10자 이상' : '가입한 이메일'}
            <input
              className="mt-2"
              required
              type={reset ? 'password' : 'email'}
              minLength={reset ? 10 : undefined}
              maxLength={reset ? 72 : 254}
              {...form.register(reset ? 'password' : 'email')}
              autoComplete={reset ? 'new-password' : 'email'}
            />
          </label>
        )}
        <FormErrors errors={form.formState.errors} className="error" />
        {message && (
          <p role="status" className="text-point">
            {message}
          </p>
        )}
        <button className="btn full mt-5" disabled={busy || !!message}>
          {busy
            ? '처리 중…'
            : verify
              ? '이메일 확인하기'
              : reset
                ? '비밀번호 변경'
                : '재설정 링크 받기'}
        </button>
      </form>
    </>
  );
}
