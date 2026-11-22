import { z } from 'zod';
import { emailSchema, requiredText } from './common';

const passwordBytes = (value: string) => new TextEncoder().encode(value).length <= 72;
export const loginPasswordSchema = z
  .string()
  .min(1, '비밀번호를 입력해 주세요.')
  .refine((value) => !!value.trim(), '비밀번호를 입력해 주세요.')
  .max(72, '비밀번호는 72자 이내로 입력해 주세요.')
  .refine(passwordBytes, '비밀번호는 UTF-8 기준 72바이트 이내로 입력해 주세요.');
export const newPasswordSchema = loginPasswordSchema.refine(
  (value) => value.length >= 10,
  '비밀번호는 10자 이상 입력해 주세요.',
);
export const loginSchema = z.object({ email: emailSchema, password: loginPasswordSchema });
export const registrationSchema = z.object({ email: emailSchema, password: newPasswordSchema });
export const adminLoginSchema = z.object({
  id: requiredText('관리자 아이디', 100),
  password: loginPasswordSchema,
});
export const recoveryEmailSchema = z.object({ email: emailSchema });
export const verificationTokenSchema = z.object({ token: requiredText('인증 링크의 토큰', 500) });
export const resetPasswordSchema = verificationTokenSchema.extend({ password: newPasswordSchema });
export const recoveryFormSchema = z.discriminatedUnion('mode', [
  recoveryEmailSchema.extend({ mode: z.literal('request') }),
  resetPasswordSchema.extend({ mode: z.literal('reset') }),
  verificationTokenSchema.extend({ mode: z.literal('verify') }),
]);
