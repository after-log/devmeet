import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/mock-api';
import { useApp } from '../stores/app';

const AuthPage = () => {
  const { mode } = useParams();
  const register = mode !== 'login';
  const navigate = useNavigate();
  const { user, setUser, resetDraft, refresh } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.profile ? '/today' : '/onboarding'} replace />;
  return (
    <>
      <Link className="back block" to="/">
        ← 처음으로
      </Link>
      <p className="eyebrow">{register ? '$ devmeet register' : '$ devmeet login'}</p>
      <h2 className="onboard-hero">
        {register ? (
          <>
            우리의 시작을
            <br />
            준비해 볼까요?
          </>
        ) : (
          <>
            오늘의 인연이
            <br />
            기다리고 있어요.
          </>
        )}
      </h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          setBusy(true);
          try {
            const { user: next } = register
              ? await api.register(email, password)
              : await api.login(email, password);
            setUser(next);
            if (next.profile) {
              await refresh();
              navigate('/today');
            } else {
              resetDraft();
              navigate('/onboarding');
            }
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="formlabel" htmlFor="email">
          이메일
          <input
            className="mt-2"
            id="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="formlabel" htmlFor="password">
          비밀번호 · 10자 이상
          <input
            className="mt-2"
            id="password"
            type="password"
            required
            minLength={10}
            maxLength={128}
            autoComplete={register ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {register && (
          <p className="secure mt-4">
            서버 연동 전이라 계정은 이 브라우저에만 저장돼요.
            <br />
            이메일 수신 인증과 비밀번호 찾기는 아직 없어요.
          </p>
        )}
        <p className="error" role="alert">
          {error}
        </p>
        <button className="btn full" type="submit" disabled={busy}>
          {register ? '계정 만들기 →' : '로그인 →'}
        </button>
      </form>
      <Link className="skip text-center" to={register ? '/auth/login' : '/auth/register'}>
        {register ? '이미 계정이 있어요' : '새 계정 만들기'}
      </Link>
    </>
  );
};
export default AuthPage;
