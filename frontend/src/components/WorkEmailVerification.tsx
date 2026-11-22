import { useEffect, useState, type FormEvent } from 'react';
import { request } from '@/lib/api';

import type { WorkEmailStatus as EmailStatus } from '@/lib/workEmail';
import CompanyEmailReviewForm from './CompanyEmailReviewForm';

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
      setNotice('이메일 소유 확인을 완료했어요. 기업 인증 상태를 확인해 주세요.');
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
      <h3 id="work-email-heading">기업 이메일 인증</h3>
      <p className="muted">
        먼저 이메일 소유를 확인해 주세요. 승인된 기업 도메인은 자동 인증되고, 미등록 회사나 개인
        메일은 자료를 제출해 관리자 검토를 받을 수 있어요. 개발 직무를 증명하는 인증은 아니에요.
      </p>
      {status?.verified && (
        <div className="mb-4 text-sm">
          <p className="text-point">이메일 소유 확인 완료</p>
          <p className="break-all">
            {status.verified.company} · {status.verified.email}
          </p>
        </div>
      )}
      {status?.companyReview && (
        <div className="mb-4 rounded-lg border border-line p-4 text-sm" role="status">
          <p className={status.companyReview.status === 'APPROVED' ? 'text-point' : 'text-fg-3'}>
            {status.companyReview.status === 'APPROVED'
              ? status.companyReview.scope === 'DOMAIN'
                ? '기업 이메일 인증 완료'
                : '소속 확인 완료 · 회원별 승인'
              : status.companyReview.status === 'PENDING'
                ? '기업 인증 검토 중'
                : status.companyReview.status === 'REJECTED'
                  ? '기업 인증 요청 반려'
                  : '기업 인증 재검토 필요'}
          </p>
          <p className="mt-2 break-all">
            {status.companyReview.company} · {status.companyReview.email}
          </p>
          {status.companyReview.note && (
            <p className="mt-2 text-xs whitespace-pre-wrap text-fg-3">
              {status.companyReview.note}
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            className="mt-2 text-xs underline"
            onClick={() => setReload((value) => value + 1)}
          >
            상태 새로고침
          </button>
        </div>
      )}
      {status?.verified &&
        !['PENDING', 'APPROVED'].includes(status.companyReview?.status ?? '') && (
          <CompanyEmailReviewForm
            key={status.verified.email + status.verified.verifiedAt}
            status={status}
            disabled={busy}
            onBusyChange={setBusy}
            onComplete={(next) => {
              setStatus(next);
              setNotice(
                next.companyReview?.status === 'APPROVED'
                  ? '승인된 기업 도메인으로 인증을 완료했어요.'
                  : '검토 요청을 보냈어요. 관리자가 확인 후 결과를 안내해 드려요.',
              );
            }}
          />
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
