import { adminApi } from '../api';
import type { CompanyEmailDomain } from '../types';
import CompanyEmailActionDialog, {
  type CompanyEmailDialogCallbacks,
} from './CompanyEmailActionDialog';

export default function CompanyDomainActivationDialog({
  domain,
  ...callbacks
}: CompanyEmailDialogCallbacks & { domain: CompanyEmailDomain }) {
  const label = domain.active ? '비활성화' : '활성화';
  return (
    <CompanyEmailActionDialog
      {...callbacks}
      title={`기업 도메인 ${label}`}
      description="회사와 도메인의 관계를 직접 확인한 결과를 기록해 주세요."
      submitLabel={label}
      danger={domain.active}
      onSubmit={(note) => adminApi.activateCompanyDomain(domain.domain, !domain.active, note)}
    >
      <p className="mb-3! text-base font-semibold">
        {domain.company} · {domain.domain}
      </p>
      <p className="mb-5! text-sm leading-relaxed text-neutral-600">
        {domain.active
          ? '자동 인증을 중단하고 이 도메인 전체 승인으로 인증된 회원의 기업 인증을 해제합니다. 이메일 소유 확인과 회원별 승인은 유지됩니다.'
          : '이후 이 도메인의 이메일 인증에 자동 승인을 사용합니다. 이미 해제된 인증은 회원이 다시 요청해야 합니다.'}
      </p>
    </CompanyEmailActionDialog>
  );
}
