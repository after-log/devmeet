import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../stores/app';
import SocialButtons from '@/components/SocialButtons';
import { FormErrors } from '@/components/ui/form-errors';
import { useLocalPasswordLogin } from '@/hooks/queries/useLocalPasswordLogin';
import { setFormError } from '@/hooks/setFormError';
import { useSchemaForm } from '@/hooks/useSchemaForm';
import { api } from '@/lib/api';
import { sessionQuery } from '@/lib/member-queries';
import { loginSchema, registrationSchema } from '@/validation/auth';

function LocalAuthForm({ register }: { register: boolean }) {
  const client = useQueryClient();
  const { demo, exitDemo, resetDraft, setUser } = useApp();
  const form = useSchemaForm(register ? registrationSchema : loginSchema, {
    defaultValues: { email: '', password: '' },
  });
  const busy = form.formState.isSubmitting;
  const submit = form.handleSubmit(async ({ email, password }) => {
    form.clearErrors('root');
    try {
      const { user } = await (register ? api.register : api.login)(email, password);
      await client.cancelQueries({ queryKey: sessionQuery.queryKey, exact: true });
      if (demo) exitDemo();
      if (!user.profile) resetDraft();
      client.setQueryData(sessionQuery.queryKey, { user });
      setUser(user);
    } catch (error) {
      setFormError(form.setError, error);
    }
  });

  return (
    <form className="mt-5" noValidate onSubmit={submit}>
      <fieldset className="min-w-0 border-0 p-0" disabled={busy}>
        <label className="formlabel">
          이메일 ID
          <input
            className="mt-2"
            type="email"
            autoComplete="username"
            maxLength={254}
            required
            {...form.register('email')}
          />
        </label>
        <label className="formlabel">
          {register ? '비밀번호 · 10자 이상' : '비밀번호'}
          <input
            className="mt-2"
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            maxLength={72}
            required
            {...form.register('password')}
          />
        </label>
        <FormErrors errors={form.formState.errors} />
        <button className="btn full mt-4" type="submit">
          {busy ? '처리 중…' : register ? '계정 만들기' : '로그인'}
        </button>
      </fieldset>
      <Link className="skip" to={register ? '/auth/login' : '/auth/register'}>
        {register ? '이메일로 로그인' : '테스트 계정 만들기'}
      </Link>
    </form>
  );
}

const AuthPage = () => {
  const { user } = useApp();
  const [params] = useSearchParams();
  const { mode } = useParams();
  const localPasswordLogin = useLocalPasswordLogin();
  if (user) return <Navigate to={user.profile ? '/today' : '/onboarding'} replace />;
  const register = localPasswordLogin && mode === 'register';
  return (
    <>
      <h2 className="onboard-hero">
        오늘의 인연이
        <br />
        기다리고 있어요.
      </h2>
      <p className="onboard-lead">
        {register
          ? '로컬에서 사용할 테스트 계정을 만들어요.'
          : localPasswordLogin
            ? '이메일과 비밀번호로 로그인하세요.'
            : '카카오 계정으로 간편하게 시작하세요.'}
      </p>
      {params.get('oauth') === 'error' && (
        <p className="error" role="alert">
          카카오 로그인에 실패했어요. 다시 시도해 주세요.
        </p>
      )}
      {!register && <SocialButtons />}
      {localPasswordLogin && <LocalAuthForm key={mode} register={register} />}
    </>
  );
};
export default AuthPage;
