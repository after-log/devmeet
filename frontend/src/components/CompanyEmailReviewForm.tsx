import { useRef, useState, type FormEvent } from 'react';
import { request } from '@/lib/api';
import type { WorkEmailStatus } from '@/lib/workEmail';

export default function CompanyEmailReviewForm({
  status,
  onComplete,
  disabled,
  onBusyChange,
}: {
  status: WorkEmailStatus;
  onComplete: (status: WorkEmailStatus) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [company, setCompany] = useState(
    status.companyReview?.company ?? status.verified?.company ?? '',
  );
  const [website, setWebsite] = useState(status.companyReview?.website ?? '');
  const [evidence, setEvidence] = useState(status.companyReview?.evidence ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current || disabled) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError('');
    try {
      onComplete(
        await request<WorkEmailStatus>('/work-email/company-review', 'POST', {
          company: company.trim(),
          website: website.trim(),
          evidence: evidence.trim(),
        }),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : '검토 요청을 보내지 못했어요.');
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  };
  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="mt-5 space-y-3 border-t border-line pt-5"
    >
      <h4 className="text-sm font-semibold">기업 인증 검토 요청</h4>
      <p className="text-xs leading-relaxed text-fg-3">
        등록되지 않은 회사도 신청할 수 있어요. 공식 홈페이지 또는 소속을 확인할 수 있는 자료·설명을
        남겨 주세요. 승인된 기업 도메인이면 자동으로 인증됩니다.
      </p>
      {status.sharedDomain && (
        <p className="text-xs text-fg-3">
          개인·공용 메일은 도메인 전체를 승인하지 않고, 제출한 자료를 확인해 회원별로 승인해요.
        </p>
      )}
      <fieldset disabled={busy || disabled} className="m-0 min-w-0 space-y-3 border-0 p-0">
        <label className="formlabel" htmlFor="review-company">
          회사명
        </label>
        <input
          id="review-company"
          required
          maxLength={100}
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          autoComplete="organization"
        />
        <label className="formlabel" htmlFor="review-website">
          공식 홈페이지
        </label>
        <input
          id="review-website"
          type="url"
          maxLength={500}
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="https://company.com"
          autoComplete="url"
        />
        <label className="formlabel" htmlFor="review-evidence">
          소속 확인 자료·설명
        </label>
        <textarea
          id="review-evidence"
          maxLength={2000}
          rows={4}
          value={evidence}
          onChange={(event) => setEvidence(event.target.value)}
          placeholder="소속을 확인할 수 있는 자료 링크나 설명을 적어 주세요. 홈페이지가 없다면 20자 이상 작성해 주세요."
        />
        <p className="text-xs text-fg-3">자료는 관리자 검토에만 사용됩니다.</p>
        <button className="btn secondary full" disabled={busy || disabled || !company.trim()}>
          {busy ? '요청 중…' : status.companyReview ? '다시 검토 요청' : '기업 인증 요청'}
        </button>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-sub">
          {error}
        </p>
      )}
    </form>
  );
}
