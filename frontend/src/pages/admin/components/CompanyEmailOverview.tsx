import { Building2, ShieldCheck } from 'lucide-react';
import type { CompanyEmailDirectory } from '../types';
import { canReviewCompanyEmail } from '../companyEmail';
import { Panel } from './AdminUI';

export default function CompanyEmailOverview({ data }: { data: CompanyEmailDirectory | null }) {
  const cards = [
    {
      label: '표시된 검토 대기',
      count: data?.requests.filter(canReviewCompanyEmail).length ?? 0,
      unit: '건',
      icon: Building2,
    },
    {
      label: '자동 인증 도메인',
      count: data?.domains.filter((item) => item.active).length ?? 0,
      unit: '개',
      icon: ShieldCheck,
    },
  ];
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4">
        {cards.map(({ label, count, unit, icon: Icon }) => (
          <Panel key={label}>
            <div className="p-5">
              <p className="flex items-center gap-2 text-sm text-neutral-600">
                <Icon size={17} />
                {label}
              </p>
              <p className="mt-2! text-3xl font-semibold">
                {count}
                <span className="ml-1 text-sm font-normal text-neutral-500">{unit}</span>
              </p>
            </div>
          </Panel>
        ))}
      </div>
      <p className="mb-5! rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-sm leading-relaxed text-neutral-600">
        이메일 소유 확인과 기업 인증은 별개입니다. 회원별 승인은 해당 회원에게만 적용됩니다.
        도메인을 승인하면 같은 도메인의 현재 검토 대기 요청과 이후 이메일 인증에 자동 적용됩니다.
        공용 메일은 회원별로 승인하세요.
      </p>
    </>
  );
}
