import { z } from 'zod';
import { photoUrlSchema, requiredText, reviewNoteSchema } from './common';

export const photoReviewSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED']),
    reason: z.string().trim().max(500, '검수 사유는 500자 이내로 입력해 주세요.'),
    photos: z
      .array(photoUrlSchema)
      .min(1, '검수할 사진을 확인해 주세요.')
      .max(6, '사진은 최대 6장까지 검수할 수 있어요.'),
  })
  .superRefine((input, ctx) => {
    if (input.status === 'REJECTED' && !input.reason)
      ctx.addIssue({ code: 'custom', path: ['reason'], message: '반려 사유를 입력해 주세요.' });
    if (input.status === 'APPROVED' && input.photos.length < 3)
      ctx.addIssue({
        code: 'custom',
        path: ['photos'],
        message: '사진이 최소 3장 등록돼야 승인할 수 있어요.',
      });
  });
export const reportReviewSchema = z.object({
  status: z.enum(['VALID', 'DISMISSED']),
  note: reviewNoteSchema,
});
export const suspensionSchema = z.object({ suspended: z.boolean(), reason: reviewNoteSchema });
export const questionDraftSchema = z
  .object({
    section: requiredText('가치관 분류', 60),
    text: requiredText('문항 내용', 200),
    purpose: z.enum(['매칭', '프로필'], { error: '문항 용도를 선택해 주세요.' }),
    options: z.array(requiredText('선택지', 100)).length(4, '선택지는 4개를 입력해 주세요.'),
  })
  .refine((input) => new Set(input.options).size === 4, {
    message: '서로 다른 선택지 4개를 입력해 주세요.',
    path: ['options'],
  });
export const questionActivationSchema = z.object({ active: z.boolean() });
