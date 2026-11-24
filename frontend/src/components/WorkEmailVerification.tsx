import { useEffect, useState } from 'react';
import { useWorkEmail } from '@/hooks/queries/useWorkEmail';

import CompanyEmailReviewForm from './CompanyEmailReviewForm';
import WorkEmailRequestForm from './WorkEmailRequestForm';
import WorkEmailCodeForm from './WorkEmailCodeForm';

export default function WorkEmailVerification() {
  const { data: status, setStatus, refetch, error: queryError } = useWorkEmail();
  const [busy, setBusy] = useState(false);
  const [formError, setError] = useState('');
  const error = formError || queryError?.message || '';
  const [notice, setNotice] = useState('');
  const [openForm, setOpenForm] = useState<'email' | 'review' | 'closed' | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!status?.pending) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [status?.pending]);

  const pending = status?.pending;
  const emailVerified = status?.verified;
  const canRequestReview =
    !!emailVerified && !['PENDING', 'APPROVED'].includes(status.companyReview?.status ?? '');
  const showEmailForm = !emailVerified || openForm === 'email' || (openForm === null && !!pending);
  const resendSeconds = pending
    ? Math.max(0, Math.ceil((Date.parse(pending.resendAt) - now) / 1000))
    : 0;
  const expired = !!pending && Date.parse(pending.expiresAt) <= now;

  return (
    <section className="panel mt-0" aria-label="기업 이메일 인증">
      {status && !emailVerified && (
        <p className="muted">
          먼저 이메일 소유를 확인해 주세요. 승인된 기업 도메인은 자동 인증되고, 미등록 회사나 개인
          메일은 자료를 제출해 관리자 검토를 받을 수 있어요. 개발 직무를 증명하는 인증은 아니에요.
        </p>
      )}
      {emailVerified && (
        <div className="mb-4 text-sm">
          <p className="text-point">이메일 소유 확인 완료</p>
          <p className="break-all">
            {emailVerified.company} · {emailVerified.email}
          </p>
          {status.available && (
            <button
              type="button"
              disabled={busy}
              aria-expanded={showEmailForm}
              className="mt-2 text-xs underline"
              onClick={() => setOpenForm(showEmailForm ? 'closed' : 'email')}
            >
              {showEmailForm
                ? '이메일 변경 닫기'
                : pending
                  ? '이메일 변경 계속하기'
                  : '이메일 변경'}
            </button>
          )}
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
            onClick={() => void refetch()}
          >
            상태 새로고침
          </button>
        </div>
      )}
      {canRequestReview && (
        <button
          type="button"
          disabled={busy}
          aria-expanded={openForm === 'review'}
          className="btn secondary full"
          onClick={() => setOpenForm(openForm === 'review' ? 'closed' : 'review')}
        >
          {openForm === 'review' ? '기업 인증 검토 요청 닫기' : '기업 인증 검토 요청'}
        </button>
      )}
      {status && emailVerified && canRequestReview && openForm === 'review' && (
        <CompanyEmailReviewForm
          key={emailVerified.email + emailVerified.verifiedAt}
          status={status}
          disabled={busy}
          onBusyChange={setBusy}
          onComplete={(next) => {
            setStatus(next);
            setOpenForm('closed');
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
        <button className="btn secondary full" onClick={() => void refetch()}>
          다시 불러오기
        </button>
      )}
      {status && showEmailForm && !status.available && (
        <p className="muted">이메일 발송은 현재 준비 중이에요. 잠시 후 다시 이용해 주세요.</p>
      )}
      {status?.available && showEmailForm && (
        <>
          <WorkEmailRequestForm
            status={status}
            disabled={busy}
            resendSeconds={resendSeconds}
            onBusyChange={setBusy}
            onComplete={(next) => {
              setStatus(next);
              setNow(Date.now());
              setError('');
              setNotice('인증번호를 보냈어요. 10분 안에 입력해 주세요.');
            }}
          />
          {pending && (
            <WorkEmailCodeForm
              key={pending.email + pending.expiresAt}
              pending={pending}
              expired={expired}
              disabled={busy}
              onBusyChange={setBusy}
              onRefresh={setStatus}
              onError={setError}
              onComplete={(next) => {
                setStatus(next);
                setOpenForm('closed');
                setError('');
                setNotice('이메일 소유 확인을 완료했어요. 기업 인증 상태를 확인해 주세요.');
              }}
            />
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
