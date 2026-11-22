import { useState } from 'react';
import { useSchemaForm } from '@/hooks/useSchemaForm';
import { setFormError } from '@/hooks/setFormError';
import { recoveryFormSchema } from '@/validation/auth';
import { FormErrors } from '@/components/ui/form-errors';
import { useLocation, useSearchParams } from 'react-router-dom';
import { request } from '@/lib/api';

export default function RecoveryPage() {
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
            if (input.mode === 'verify') {
              await request('/auth/email/verify', 'POST', { token: input.token });
              setMessage('이메일 확인이 완료됐어요.');
            } else if (input.mode === 'reset') {
              await request('/auth/password/reset', 'POST', {
                token: input.token,
                password: input.password,
              });
              setMessage('비밀번호를 바꿨어요. 다시 로그인해 주세요.');
            } else {
              const response = await request<{ message: string }>(
                '/auth/password/request',
                'POST',
                { email: input.email },
              );
              setMessage(response.message);
            }
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
