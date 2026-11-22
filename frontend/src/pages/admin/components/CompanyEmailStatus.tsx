import { companyEmailStatusLabels } from '../companyEmail';
import type { CompanyEmailRequest } from '../types';

export default function CompanyEmailStatus({ status }: { status: CompanyEmailRequest['status'] }) {
  return (
    <span
      className={`rounded px-2 py-1 text-xs ${status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800' : status === 'PENDING' ? 'bg-amber-50 text-amber-800' : 'bg-neutral-100 text-neutral-600'}`}
    >
      {companyEmailStatusLabels[status]}
    </span>
  );
}
