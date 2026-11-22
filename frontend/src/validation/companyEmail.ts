import { z } from 'zod';
import {
  emailSchema,
  httpWebsiteSchema,
  requiredText,
  requiredWebsiteSchema,
  reviewNoteSchema,
} from './common';

export const workEmailRequestSchema = z.object({
  company: requiredText('회사명', 100),
  email: emailSchema,
});
export const workEmailCodeSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, '인증번호 6자리를 입력해 주세요.'),
});
export const companyEmailReviewSchema = z
  .object({
    company: requiredText('회사명', 100),
    website: httpWebsiteSchema,
    evidence: z.string().trim().max(2000, '소속 확인 자료는 2000자 이내로 입력해 주세요.'),
  })
  .refine((value) => !!value.website || value.evidence.length >= 20, {
    message: '공식 홈페이지 또는 소속 확인 자료·설명(20자 이상)을 입력해 주세요.',
    path: ['evidence'],
  });
export const companyDomainSchema = z
  .string()
  .trim()
  .min(1, '이메일 도메인을 입력해 주세요.')
  .max(253, '도메인은 253자 이내로 입력해 주세요.')
  .transform((value, context) => {
    try {
      if (/[\s/@:*?#\\]/.test(value)) throw new Error();
      const domain = new URL(`https://${value}`).hostname.toLowerCase();
      if (
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(domain) ||
        /^[0-9.]+$/.test(domain) ||
        domain.length > 253 ||
        domain.split('.').some((label) => label.length > 63)
      )
        throw new Error();
      return domain;
    } catch {
      context.addIssue({
        code: 'custom',
        message: '이메일 도메인만 입력해 주세요. 예: company.com',
      });
      return z.NEVER;
    }
  });
export const companyDomainRegistrationSchema = z.object({
  company: requiredText('회사명', 100),
  domain: companyDomainSchema,
  website: requiredWebsiteSchema,
  note: reviewNoteSchema,
});
export const companyEmailDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], { error: '처리 결과를 선택해 주세요.' }),
  scope: z.enum(['MEMBER', 'DOMAIN'], { error: '승인 범위를 선택해 주세요.' }),
  note: reviewNoteSchema,
});
export const companyDomainActivationSchema = z.object({
  active: z.boolean(),
  note: reviewNoteSchema,
});
