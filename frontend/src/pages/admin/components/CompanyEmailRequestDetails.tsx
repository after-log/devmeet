import { adminDate } from '../api';
import { companyEmailStatusLabels } from '../companyEmail';
import type { CompanyEmailRequest } from '../types';

export default function CompanyEmailRequestDetails({ request }: { request: CompanyEmailRequest }) {
  return (
    <div className="mb-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
      <p className="font-semibold">
        {request.memberName} · {request.company}
      </p>
      <p className="mt-2! break-all">{request.email}</p>
      <p className="mt-1! text-xs text-neutral-500">
        {request.emailVerifiedAt
          ? `이메일 소유 확인: ${adminDate(request.emailVerifiedAt, true)}`
          : '현재 인증 이메일과 연결되지 않은 이전 요청입니다.'}
      </p>
      {request.website && (
        <a
          className="mt-3 inline-block underline!"
          href={request.website}
          target="_blank"
          rel="noopener noreferrer"
        >
          제출된 공식 홈페이지
        </a>
      )}
      <p className="mt-3! break-words whitespace-pre-wrap text-neutral-600">
        {request.evidence || '추가 설명 없음'}
      </p>
      {request.note && (
        <p className="mt-3! border-t border-neutral-200 pt-3 whitespace-pre-wrap text-neutral-600">
          처리 사유: {request.note}
        </p>
      )}
      <p className="mt-2! text-xs text-neutral-500">
        상태: {companyEmailStatusLabels[request.status]}
        {request.scope ? ` · ${request.scope === 'DOMAIN' ? '도메인 승인' : '회원별 승인'}` : ''}
      </p>
    </div>
  );
}
