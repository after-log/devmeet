import type { CompanyEmailDomain, CompanyEmailRequest } from '../types';
import type { CompanyEmailDialogCallbacks } from './CompanyEmailActionDialog';
import CompanyEmailReviewDialog from './CompanyEmailReviewDialog';
import CompanyDomainRegisterDialog from './CompanyDomainRegisterDialog';
import CompanyDomainActivationDialog from './CompanyDomainActivationDialog';

export type CompanyEmailDialog =
  | { type: 'review'; item: CompanyEmailRequest }
  | { type: 'register' }
  | { type: 'toggle'; item: CompanyEmailDomain };

export default function CompanyEmailDialogs({
  dialog,
  ...callbacks
}: CompanyEmailDialogCallbacks & { dialog: CompanyEmailDialog | null }) {
  if (!dialog) return null;
  if (dialog.type === 'review')
    return <CompanyEmailReviewDialog key={dialog.item.id} request={dialog.item} {...callbacks} />;
  if (dialog.type === 'register') return <CompanyDomainRegisterDialog {...callbacks} />;
  return (
    <CompanyDomainActivationDialog key={dialog.item.domain} domain={dialog.item} {...callbacks} />
  );
}
