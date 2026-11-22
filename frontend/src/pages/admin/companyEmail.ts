import type { CompanyEmailRequest } from './types';

export const companyEmailStatusLabels: Record<CompanyEmailRequest['status'], string> = {
  PENDING: '검토 대기',
  APPROVED: '승인',
  REJECTED: '반려',
  SUPERSEDED: '이메일 변경',
  REVOKED: '승인 해제',
};

export function canReviewCompanyEmail(request: CompanyEmailRequest) {
  return request.status === 'PENDING' && request.current;
}
