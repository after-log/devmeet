import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { request } from '@/lib/api';

export default function RecoveryPage() {
  const { pathname } = useLocation();
  const [query] = useSearchParams();
  const verify = pathname.endsWith('/verify');
  const reset = pathname.endsWith('/reset');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Link className="back" to="/auth/login">
        ← 로그인
      </Link>
      <h2>{verify ? '이메일 확인' : reset ? '새 비밀번호' : '비밀번호 찾기'}</h2>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError('');
          try {
            if (verify) {
              await request('/auth/email/verify', 'POST', { token: query.get('token') ?? '' });
              setMessage('이메일 확인이 완료됐어요.');
            } else if (reset) {
              await request('/auth/password/reset', 'POST', {
                token: query.get('token') ?? '',
                password,
              });
              setMessage('비밀번호를 바꿨어요. 다시 로그인해 주세요.');
            } else {
              const response = await request<{ message: string }>(
                '/auth/password/request',
                'POST',
                { email },
              );
              setMessage(response.message);
            }
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
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
              value={reset ? password : email}
              onChange={(event) =>
                reset ? setPassword(event.target.value) : setEmail(event.target.value)
              }
              autoComplete={reset ? 'new-password' : 'email'}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-green">
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
