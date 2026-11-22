export type CompanyEmailReview = {
  id: string;
  company: string;
  email: string;
  domain: string;
  website: string;
  evidence: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED' | 'REVOKED';
  scope: 'MEMBER' | 'DOMAIN' | null;
  note: string;
  submittedAt: string;
  reviewedAt: string | null;
};
export type WorkEmailStatus = {
  available: boolean;
  verified: { company: string; email: string; verifiedAt: string } | null;
  pending: { company: string; email: string; expiresAt: string; resendAt: string } | null;
  companyReview: CompanyEmailReview | null;
  sharedDomain: boolean;
};
