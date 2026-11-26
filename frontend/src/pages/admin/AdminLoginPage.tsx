import { useState } from 'react';
import { useSchemaForm } from '@/hooks/useSchemaForm';
import { setFormError } from '@/hooks/setFormError';
import { adminLoginSchema } from '@/validation/auth';
import { FormErrors } from '@/components/ui/form-errors';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAdmin } from './hooks/useAdmin';
import { AdminButton, AdminSurface, Field, IconButton } from './components/AdminUI';

export default function AdminLoginPage() {
  const { authenticated, booting, busy, login, error: sessionError, initialize } = useAdmin();
  const form = useSchemaForm(adminLoginSchema, { defaultValues: { id: '', password: '' } });
  const [showPassword, setShowPassword] = useState(false);
  if (booting)
    return (
      <AdminSurface className="grid min-h-dvh place-items-center bg-white">
        <p role="status">관리자 세션 확인 중…</p>
      </AdminSurface>
    );
  if (authenticated) return <Navigate to="/admin" replace />;
  const submit = form.handleSubmit(async (credentials) => {
    form.clearErrors('root');
    try {
      await login(credentials.id, credentials.password);
    } catch (error) {
      setFormError(form.setError, error);
    }
  });
  return (
    <AdminSurface className="grid min-h-dvh grid-cols-2 bg-white max-sm:block">
      <div className="flex min-h-dvh flex-col justify-between bg-[#e5e5e5] px-16.25 py-12.5 max-[900px]:p-10 max-sm:min-h-0 max-sm:px-7 max-sm:py-6.25">
        <Link to="/" className="font-mono text-[33px] font-bold tracking-[-2px] text-[#262626]">
          찌릿
        </Link>
        <div className="max-sm:hidden">
          <span className="text-[12px] font-semibold tracking-[1.7px] text-neutral-600">
            DEVMEET ADMINISTRATION
          </span>
          <h1 className="mt-5.25! text-[38px] leading-normal font-semibold tracking-[-1.7px] text-neutral-700 max-[900px]:text-[30px]">
            좋은 만남의 시작을,
            <br />
            함께 관리해요.
          </h1>
          <p className="mt-4.25! text-[14px] leading-[1.9] text-neutral-600">
            안전한 프로필과 신뢰할 수 있는 커뮤니티.
            <br />
            찌릿 운영을 위한 관리자 워크스페이스.
          </p>
          <div className="mt-15 flex items-center gap-5.75 text-neutral-600">
            <ShieldCheck size={68} strokeWidth={1} />
            <span className="font-mono text-sm leading-[1.9] text-neutral-600">
              Thoughtful connections,
              <br />
              thoughtfully managed.
            </span>
          </div>
        </div>
        <small className="text-[12px] text-neutral-600 max-sm:hidden">
          © 2026 찌릿. All rights reserved.
        </small>
      </div>
      <main className="grid place-items-center p-11.25 max-sm:px-7 max-sm:py-8.75">
        <form noValidate onSubmit={submit} className="w-full max-w-87.5 max-sm:max-w-100">
          <div className="mb-5.75 grid size-12 place-items-center rounded-xl bg-[#f5f5f5] text-neutral-600">
            <LockKeyhole size={23} />
          </div>
          <h2 className="mb-2! text-[25px] font-semibold max-sm:text-[23px]">관리자 로그인</h2>
          <p className="mb-7.25! text-sm text-neutral-600">
            관리자 계정으로 워크스페이스에 접속하세요.
          </p>
          <Field label="아이디">
            <input
              className="mt-1.75 block min-h-10.5 w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2.5 text-sm font-normal text-[#262626] placeholder:text-neutral-600"
              autoComplete="username"
              placeholder="관리자 아이디"
              {...form.register('id')}
              required
            />
          </Field>
          <Field label="비밀번호">
            <div className="relative mt-1.75">
              <input
                className="min-h-10.5 w-full rounded-lg border border-[#e5e5e5] bg-white py-2.5 pr-10.5 pl-3 text-sm font-normal text-[#262626] placeholder:text-neutral-600"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호 입력"
                {...form.register('password')}
                required
              />
              <IconButton
                className="absolute top-1.5 right-1.5"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </IconButton>
            </div>
          </Field>
          <FormErrors
            errors={form.formState.errors}
            serverError={sessionError}
            className="mt-3! text-[13px] text-red-700"
          />
          <AdminButton
            type="submit"
            disabled={busy}
            variant="primary"
            className="mt-6.25 w-full justify-between px-4.25 py-3"
          >
            {busy ? '로그인 중…' : '로그인'} <ArrowRight size={17} />
          </AdminButton>
          {sessionError && (
            <AdminButton className="mt-3 w-full" onClick={() => void initialize()}>
              서버 연결 다시 확인
            </AdminButton>
          )}
          <Link className="mt-6.5 block text-center text-[13px] text-neutral-600" to="/">
            ← 서비스로 돌아가기
          </Link>
        </form>
      </main>
    </AdminSurface>
  );
}
