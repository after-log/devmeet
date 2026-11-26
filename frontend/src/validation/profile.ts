import { z } from 'zod';
import { GENDERS } from '@/data/options';
import { photoUrlSchema, requiredText } from './common';

export const PUBLIC_VALUE_LIMIT = 10;
const age = z
  .number({ error: '나이를 숫자로 입력해 주세요.' })
  .int('나이는 정수로 입력해 주세요.')
  .min(19, '나이는 19세 이상이어야 해요.')
  .max(80, '나이는 80세 이하여야 해요.');
const height = z
  .number({ error: '키를 숫자로 입력해 주세요.' })
  .int('키는 정수로 입력해 주세요.')
  .min(100, '키는 100cm 이상 입력해 주세요.')
  .max(250, '키는 250cm 이하로 입력해 주세요.');
const role = z.enum(['developer', 'non-developer'], { error: '개발자 여부를 선택해 주세요.' });
const gender = z.enum(GENDERS, { error: '성별을 선택해 주세요.' });
export const profilePhotosSchema = z
  .array(photoUrlSchema)
  .min(3, '프로필 사진을 최소 3장 등록해 주세요.')
  .max(6, '프로필 사진은 최대 6장까지 등록할 수 있어요.')
  .refine((photos) => new Set(photos).size === photos.length, '서로 다른 사진을 등록해 주세요.');
export const photoUploadCountSchema = z
  .number()
  .int()
  .min(0)
  .max(6, '프로필 사진은 최대 6장까지 등록할 수 있어요.');
export const photoFileSchema = z
  .custom<File>(
    (file) => typeof File !== 'undefined' && file instanceof File,
    '사진 파일을 선택해 주세요.',
  )
  .refine(
    (file) => !!file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'JPEG·PNG·WebP 사진을 선택해 주세요.',
  )
  .refine((file) => !!file && file.size <= 10 * 1024 * 1024, '사진은 10MB 이하로 선택해 주세요.');
export const photoDimensionsSchema = z
  .object({ width: z.number().positive(), height: z.number().positive() })
  .refine((image) => image.width * image.height <= 40_000_000, '사진 해상도가 너무 커요.');
export const valueAnswersSchema = z
  .record(
    z.string(),
    z.object({
      choice: z.string().max(100, '답변 내용을 확인해 주세요.').nullable(),
      private: z.boolean({ error: '답변 공개 여부를 확인해 주세요.' }),
    }),
  )
  .refine(
    (answers) =>
      Object.values(answers).filter((answer) => answer.choice !== null && !answer.private).length <=
      PUBLIC_VALUE_LIMIT,
    '프로필에는 가치관 답변을 최대 10개까지 공개할 수 있어요.',
  );
export function createValueAnswersSchema(questions: readonly { id: string; options: string[] }[]) {
  const catalog = new Map(questions.map((question) => [question.id, question]));
  return valueAnswersSchema.superRefine((answers, context) => {
    for (const [id, answer] of Object.entries(answers)) {
      const question = catalog.get(id);
      if (!question || (answer.choice !== null && !question.options.includes(answer.choice)))
        context.addIssue({
          code: 'custom',
          path: [id, 'choice'],
          message: '가치관 문항과 선택지를 확인해 주세요.',
        });
    }
  });
}
export const preferenceFieldsSchema = z.object({
  minAge: age.default(19),
  maxAge: age.default(60),
  region: z.string().trim().max(40, '지역은 40자 이내로 입력해 주세요.').default(''),
});
const ageOrder = (input: { minAge: number; maxAge: number }) => input.minAge <= input.maxAge;
export const preferencesSchema = preferenceFieldsSchema.refine(ageOrder, {
  message: '최소 나이는 최대 나이보다 작거나 같아야 해요.',
  path: ['maxAge'],
});
const basicFields = {
  name: requiredText('이름', 30),
  age,
  gender,
  height,
  job: requiredText('직업', 60),
  education: requiredText('학력', 40),
};
const lifestyleFields = {
  meeting: requiredText('만남 방식', 40),
  contact: requiredText('연락 방식', 40),
  smoking: requiredText('흡연 여부', 30),
  drinking: requiredText('음주 여부', 30),
  religion: requiredText('종교', 30),
};
export const profileSchema = z
  .object({
    ...basicFields,
    ...lifestyleFields,
    ...preferenceFieldsSchema.shape,
    role,
    location: requiredText('지역', 60),
    preference: requiredText('선호 직군', 20).default('상관없어요'),
    intro: requiredText('자기소개', 1000),
    tags: z
      .array(requiredText('태그', 20))
      .max(5, '태그는 최대 5개까지 입력해 주세요.')
      .default([]),
    photo: z.string().max(2_000_000, '사진 정보를 확인해 주세요.').optional(),
    photos: profilePhotosSchema,
    valueAnswers: valueAnswersSchema.optional(),
  })
  .refine(ageOrder, { message: '최소 나이는 최대 나이보다 작거나 같아야 해요.', path: ['maxAge'] });
export const onboardingStepSchemas = [
  z.object({ role }),
  z.object({
    ...basicFields,
    city: requiredText('시·도', 30),
    district: requiredText('시·군·구', 30),
  }),
  z.object(lifestyleFields),
  z.object({ photos: profilePhotosSchema, intro: requiredText('자기소개', 1000) }),
];

const onboardingDraftFields = z
  .object({
    role: role.optional(),
    name: z.string().optional(),
    age: z.number().optional(),
    gender: gender.nullish(),
    height: z.number().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    job: z.string().optional(),
    education: z.string().optional(),
    meeting: z.string().optional(),
    contact: z.string().optional(),
    preference: z.string().optional(),
    smoking: z.string().optional(),
    drinking: z.string().optional(),
    religion: z.string().optional(),
    intro: z.string().optional(),
    photos: z.array(z.string()).optional(),
    tagsText: z.string().optional(),
  })
  .passthrough();
export function createOnboardingSchema(step: number) {
  return onboardingDraftFields.superRefine((draft, context) => {
    const result = onboardingStepSchemas[step]?.safeParse(draft);
    if (!result?.success)
      for (const issue of result?.error.issues ?? [
        { message: '가입 단계를 확인해 주세요.', path: [] },
      ])
        context.addIssue({ code: 'custom', message: issue.message, path: issue.path });
  });
}
