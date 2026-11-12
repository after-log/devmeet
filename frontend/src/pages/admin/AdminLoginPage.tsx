import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAdminMock } from './hooks/useAdminMock';
import { AdminButton, AdminSurface, Badge, Field, IconButton } from './components/AdminUI';

export default function AdminLoginPage() {
  const { authenticated, login } = useAdminMock();
  const [credentials, setCredentials] = useState({ id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  if (authenticated) return <Navigate to="/admin" replace />;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!login(credentials.id, credentials.password))
      setError('아이디 또는 비밀번호를 확인해 주세요.');
  };
  return (
    <AdminSurface className="grid min-h-dvh grid-cols-2 bg-white max-sm:block">
      <div className="flex min-h-dvh flex-col justify-between bg-[#e5e5e5] px-[65px] py-[50px] max-[900px]:p-10 max-sm:min-h-0 max-sm:px-7 max-sm:py-[25px]">
        <Link to="/" className="font-mono text-[33px] font-bold tracking-[-2px] text-[#262626]">
          devmeet<span className="text-[#262626]">.</span>
        </Link>
        <div className="max-sm:hidden">
          <span className="text-[9px] font-semibold tracking-[1.7px] text-[#a3a3a3]">
            DEVMEET ADMINISTRATION
          </span>
          <h1 className="mt-[21px]! text-[38px] leading-normal font-semibold tracking-[-1.7px] text-[#525252] max-[900px]:text-[30px]">
            좋은 만남의 시작을,
            <br />
            함께 관리해요.
          </h1>
          <p className="mt-[17px]! text-[13px] leading-[1.9] text-[#a3a3a3]">
            안전한 프로필과 신뢰할 수 있는 커뮤니티.
            <br />
            devmeet 운영을 위한 관리자 워크스페이스.
          </p>
          <div className="mt-[60px] flex items-center gap-[23px] text-[#a3a3a3]">
            <ShieldCheck size={68} strokeWidth={1} />
            <span className="font-mono text-xs leading-[1.9] text-[#a3a3a3]">
              Thoughtful connections,
              <br />
              thoughtfully managed.
            </span>
          </div>
        </div>
        <small className="text-[10px] text-[#a3a3a3] max-sm:hidden">
          © 2026 devmeet. All rights reserved.
        </small>
      </div>
      <main className="grid place-items-center p-[45px] max-sm:px-7 max-sm:py-[35px]">
        <form onSubmit={submit} className="w-full max-w-[350px] max-sm:max-w-[400px]">
          <div className="mb-[23px] grid size-12 place-items-center rounded-xl bg-[#f5f5f5] text-[#737373]">
            <LockKeyhole size={23} />
          </div>
          <h2 className="mb-2! text-[25px] font-semibold max-sm:text-[23px]">관리자 로그인</h2>
          <p className="mb-[29px]! text-xs text-[#a3a3a3]">
            관리자 계정으로 워크스페이스에 접속하세요.
          </p>
          <Field label="아이디">
            <input
              className="mt-[7px] block min-h-[42px] w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2.5 text-xs font-normal text-[#262626] placeholder:text-[#a3a3a3]"
              autoComplete="username"
              placeholder="관리자 아이디"
              value={credentials.id}
              onChange={(e) => setCredentials({ ...credentials, id: e.target.value })}
              required
            />
          </Field>
          <Field label="비밀번호">
            <div className="relative mt-[7px]">
              <input
                className="min-h-[42px] w-full rounded-lg border border-[#e5e5e5] bg-white py-2.5 pr-[42px] pl-3 text-xs font-normal text-[#262626] placeholder:text-[#a3a3a3]"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호 입력"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
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
          {error && (
            <p className="mt-3! text-[11px] text-[#737373]" role="alert">
              {error}
            </p>
          )}
          <AdminButton
            type="submit"
            variant="primary"
            className="mt-[25px] w-full justify-between px-[17px] py-3"
          >
            로그인 <ArrowRight size={17} />
          </AdminButton>
          <div className="mt-5 rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3.5">
            <Badge status="MOCK">UI PREVIEW</Badge>
            <p className="mt-2! text-[10px] leading-[1.9] text-[#a3a3a3]">
              체험 계정 <b className="font-medium text-[#737373]">admin</b> /{' '}
              <b className="font-medium text-[#737373]">devmeet123!</b>
              <br />
              화면 확인용 로그인입니다. 실제 접근 제어는 백엔드 연동 시 적용됩니다.
            </p>
          </div>
          <Link className="mt-[26px] block text-center text-[11px] text-[#a3a3a3]" to="/">
            ← 서비스로 돌아가기
          </Link>
        </form>
      </main>
    </AdminSurface>
  );
}
