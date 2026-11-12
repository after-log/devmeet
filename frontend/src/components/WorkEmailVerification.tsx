import { useEffect, useState, type FormEvent } from 'react';
import { request } from '@/lib/api';

type EmailStatus = {
  available: boolean;
  verified: { company: string; email: string; verifiedAt: string } | null;
  pending: { company: string; email: string; expiresAt: string; resendAt: string } | null;
};

export default function WorkEmailVerification() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    void request<EmailStatus>('/work-email')
      .then((value) => {
        if (!active) return;
        setStatus(value);
        setCompany(value.pending?.company ?? value.verified?.company ?? '');
        setEmail(value.pending?.email ?? value.verified?.email ?? '');
        setError('');
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [reload]);

  useEffect(() => {
    if (!status?.pending) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [status?.pending]);

  const pending = status?.pending;
  const resendSeconds = pending
    ? Math.max(0, Math.ceil((Date.parse(pending.resendAt) - now) / 1000))
    : 0;
  const expired = !!pending && Date.parse(pending.expiresAt) <= now;

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setStatus(
        await request<EmailStatus>('/work-email/request', 'POST', {
          company: company.trim(),
          email: email.trim(),
        }),
      );
      setCode('');
      setNow(Date.now());
      setNotice('인증번호를 보냈어요. 10분 안에 입력해 주세요.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setStatus(await request<EmailStatus>('/work-email/verify', 'POST', { code }));
      setCode('');
      setNotice('이메일 확인을 완료했어요.');
    } catch (err) {
      setError((err as Error).message);
      // Refresh the pending challenge after expiration or too many incorrect attempts.
      try {
        setStatus(await request<EmailStatus>('/work-email'));
      } catch {
        /* Keep the original error. */
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="work-email-heading">
      <h3 id="work-email-heading">회사 이메일 확인</h3>
      <p className="muted">
        회사명과 회사 이메일을 입력해 주세요. 이메일 접근 권한을 확인하며, 재직 여부나 개발 직무를
        증명하지는 않아요.
      </p>
      {status?.verified && (
        <div className="mb-4 text-sm">
          <p className="text-point">이메일 확인 완료</p>
          <p className="break-all">
            {status.verified.company} · {status.verified.email}
          </p>
        </div>
      )}
      {!status && !error && (
        <p className="muted" role="status">
          불러오는 중…
        </p>
      )}
      {!status && error && (
        <button className="btn secondary full" onClick={() => setReload(reload + 1)}>
          다시 불러오기
        </button>
      )}
      {status && !status.available && (
        <p className="muted">이메일 발송은 현재 준비 중이에요. 잠시 후 다시 이용해 주세요.</p>
      )}
      {status?.available && (
        <>
          <form onSubmit={(event) => void send(event)} className="space-y-3">
            <label className="formlabel" htmlFor="work-company">
              회사명
            </label>
            <input
              id="work-company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              maxLength={100}
              required
              disabled={busy}
              autoComplete="organization"
            />
            <label className="formlabel" htmlFor="work-email">
              회사 이메일
            </label>
            <input
              id="work-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              required
              disabled={busy}
              autoComplete="email"
              placeholder="name@company.com"
            />
            <button
              className="btn secondary full"
              disabled={busy || resendSeconds > 0 || !company.trim() || !email.trim()}
            >
              {resendSeconds > 0
                ? `${resendSeconds}초 후 다시 받기`
                : pending
                  ? '인증번호 다시 받기'
                  : '인증번호 받기'}
            </button>
          </form>
          {pending && (
            <form className="mt-4 space-y-3" onSubmit={(event) => void verify(event)}>
              <p className="text-xs break-all text-fg-3">인증번호를 보낸 주소: {pending.email}</p>
              <label className="formlabel" htmlFor="work-email-code">
                인증번호 6자리
              </label>
              <input
                id="work-email-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                pattern="[0-9]{6}"
                maxLength={6}
                required
                disabled={busy || expired}
              />
              {expired && (
                <p className="text-xs text-sub">인증번호가 만료됐어요. 새 번호를 받아 주세요.</p>
              )}
              <button className="btn full" disabled={busy || expired || code.length !== 6}>
                이메일 확인하기
              </button>
            </form>
          )}
        </>
      )}
      {notice && (
        <p className="text-sm text-point" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="text-sm text-sub" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
