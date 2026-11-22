import { useState } from 'react';
import { adminApi } from '../api';
import { canReviewCompanyEmail } from '../companyEmail';
import type { CompanyEmailRequest } from '../types';
import { Field } from '../components/AdminUI';
import CompanyEmailRequestDetails from '../components/CompanyEmailRequestDetails';
import CompanyEmailActionDialog, {
  type CompanyEmailDialogCallbacks,
} from './CompanyEmailActionDialog';

export default function CompanyEmailReviewDialog({
  request,
  ...callbacks
}: CompanyEmailDialogCallbacks & { request: CompanyEmailRequest }) {
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [scope, setScope] = useState<'MEMBER' | 'DOMAIN'>('MEMBER');
  const canReview = canReviewCompanyEmail(request);
  const selectClass =
    'mt-2 block w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800';
  return (
    <CompanyEmailActionDialog
      {...callbacks}
      title="기업 인증 요청 검토"
      description="이메일 소유 확인 이력과 제출 자료를 확인한 뒤 처리해 주세요."
      danger={decision === 'REJECTED'}
      submitLabel={decision === 'APPROVED' ? '승인' : '반려'}
      onSubmit={
        canReview
          ? (note) => adminApi.reviewCompanyEmail(request.id, { status: decision, scope, note })
          : undefined
      }
    >
      <CompanyEmailRequestDetails request={request} />
      {canReview && (
        <div className="mb-4">
          <Field label="처리 결과">
            <select
              value={decision}
              onChange={(event) => setDecision(event.target.value as typeof decision)}
              className={selectClass}
            >
              <option value="APPROVED">승인</option>
              <option value="REJECTED">반려</option>
            </select>
          </Field>
          {decision === 'APPROVED' && (
            <>
              <Field label="승인 범위">
                <select
                  value={scope}
                  onChange={(event) => setScope(event.target.value as typeof scope)}
                  className={selectClass}
                >
                  <option value="MEMBER">이 회원만 승인</option>
                  <option value="DOMAIN" disabled={request.sharedDomain || !request.website}>
                    기업 도메인 전체 승인
                  </option>
                </select>
              </Field>
              <p className="mt-3! text-sm text-neutral-600">
                {request.sharedDomain
                  ? '공용 메일은 회원별로만 승인할 수 있습니다.'
                  : !request.website
                    ? '도메인 전체 승인은 공식 홈페이지가 필요합니다. 자료 확인 후 도메인 등록에서 별도로 등록할 수도 있습니다.'
                    : scope === 'DOMAIN'
                      ? '이 도메인의 현재 대기 요청도 같은 회사명으로 승인되며, 이후 같은 도메인은 자동 인증됩니다.'
                      : '다른 회원과 도메인 전체에는 영향을 주지 않습니다.'}
              </p>
            </>
          )}
        </div>
      )}
    </CompanyEmailActionDialog>
  );
}
