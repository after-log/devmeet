import { z } from 'zod';

export const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label}을(를) 입력해 주세요.` })
    .trim()
    .min(1, `${label}을(를) 입력해 주세요.`)
    .max(max, `${label}은(는) ${max}자 이내로 입력해 주세요.`);
export const emailSchema = z
  .string()
  .trim()
  .min(1, '이메일을 입력해 주세요.')
  .max(254, '이메일은 254자 이내로 입력해 주세요.')
  .email('이메일 주소를 확인해 주세요.')
  .toLowerCase();
export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    '대상 정보를 다시 확인해 주세요.',
  );
export const reviewNoteSchema = requiredText('처리 사유', 1000);
export const httpWebsiteSchema = z
  .string()
  .trim()
  .max(500, '홈페이지 주소는 500자 이내로 입력해 주세요.')
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !!url.hostname &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, '홈페이지는 http 또는 https 주소로 입력해 주세요.');
export const requiredWebsiteSchema = httpWebsiteSchema.refine(
  Boolean,
  '공식 홈페이지를 입력해 주세요.',
);

export const photoUrlSchema = z
  .string()
  .regex(/^\/api\/photos\/[0-9a-f-]{36}$/i, '업로드한 프로필 사진을 선택해 주세요.');
