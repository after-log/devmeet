import { z } from 'zod';
import { requiredText, uuidSchema } from './common';

const weight = z
  .number({ error: '가중치를 숫자로 입력해 주세요.' })
  .int('가중치는 정수로 입력해 주세요.')
  .min(0, '가중치는 0% 이상이어야 해요.')
  .max(100, '가중치는 100% 이하여야 해요.');
export const matchingPresetSchema = z
  .object({
    baseId: uuidSchema.nullable(),
    name: requiredText('프리셋 이름', 60),
    description: z.string().trim().max(300, '설명은 300자 이내로 입력해 주세요.'),
    valuesWeight: weight,
    meetingWeight: weight,
    contactWeight: weight,
  })
  .refine((draft) => draft.valuesWeight + draft.meetingWeight + draft.contactWeight === 100, {
    message: '가중치 합계를 100%로 맞춰 주세요.',
    path: ['valuesWeight'],
  });
export const matchingActivationSchema = z.object({ id: uuidSchema });
