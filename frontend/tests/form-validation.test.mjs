import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const load = (name) =>
  loadTypeScript(new URL('../src/validation/' + name + '.ts', import.meta.url));
const auth = await load('auth');
const profile = await load('profile');
const company = await load('companyEmail');
const admin = await load('admin');
const matching = await load('matching');
const forms = await load('forms');
const photo = (id) => '/api/photos/00000000-0000-4000-8000-' + String(id).padStart(12, '0');
const preset = {
  baseId: null,
  name: ' 균형형 ',
  description: '',
  valuesWeight: 40,
  meetingWeight: 30,
  contactWeight: 30,
};

test('login normalizes identifiers and preserves password whitespace while enforcing UTF-8 limits', () => {
  const result = auth.loginSchema.parse({ email: ' Member@Example.test ', password: ' password ' });
  assert.equal(result.email, 'member@example.test');
  assert.equal(result.password, ' password ');
  assert.equal(auth.newPasswordSchema.safeParse('가'.repeat(24)).success, true);
  assert.equal(auth.newPasswordSchema.safeParse('가'.repeat(25)).success, false);
  assert.equal(auth.loginPasswordSchema.safeParse('   ').success, false);
});

test('recovery checks the fields required by each flow', () => {
  assert.equal(
    auth.recoveryFormSchema.safeParse({ mode: 'request', email: 'invalid' }).success,
    false,
  );
  assert.equal(
    auth.recoveryFormSchema.safeParse({ mode: 'reset', token: '', password: 'long-password' })
      .success,
    false,
  );
  assert.equal(auth.recoveryFormSchema.safeParse({ mode: 'verify', token: 'token' }).success, true);
});

test('numeric constraints, missing values and reversed ages are rejected', () => {
  for (const input of [
    { minAge: '', maxAge: 30 },
    { minAge: 35, maxAge: 20 },
    { minAge: 18, maxAge: 30 },
    { minAge: 20.5, maxAge: 30 },
  ])
    assert.equal(profile.preferencesSchema.safeParse(input).success, false);
  assert.deepEqual(profile.preferencesSchema.parse({ minAge: 19, maxAge: 80 }), {
    minAge: 19,
    maxAge: 80,
    region: '',
  });
});

test('onboarding validates only the current step and enforces integer profile fields', () => {
  assert.equal(profile.createOnboardingSchema(0).safeParse({ role: 'developer' }).success, true);
  assert.equal(
    profile
      .createOnboardingSchema(1)
      .safeParse({
        name: '지원',
        age: 25,
        height: 170.5,
        city: '서울',
        district: '성동구',
        job: '개발자',
        education: '대학교',
      }).success,
    false,
  );
  assert.equal(
    profile
      .createOnboardingSchema(3)
      .safeParse({ photos: [photo(1), photo(2), photo(3)], intro: ' 소개 ' }).success,
    true,
  );
});

test('photos must be uploaded, distinct, and between three and six', () => {
  assert.equal(profile.profilePhotosSchema.safeParse([photo(1), photo(2)]).success, false);
  assert.equal(
    profile.profilePhotosSchema.safeParse([photo(1), photo(1), photo(2)]).success,
    false,
  );
  assert.equal(
    profile.profilePhotosSchema.safeParse([photo(1), photo(2), 'https://external.test/photo.jpg'])
      .success,
    false,
  );
  assert.equal(profile.photoFileSchema.safeParse(null).success, false);
  assert.equal(
    profile.photoDimensionsSchema.safeParse({ width: 10000, height: 10000 }).success,
    false,
  );
});

test('value answers follow the current catalog and public-answer limit', () => {
  const questions = Array.from({ length: 11 }, (_, i) => ({
    id: 'Q' + i,
    options: ['예', '아니요'],
  }));
  const schema = profile.createValueAnswersSchema(questions);
  const answers = Object.fromEntries(
    questions.map((question) => [question.id, { choice: '예', private: false }]),
  );
  assert.equal(schema.safeParse(answers).success, false);
  answers.Q10.private = true;
  assert.equal(schema.safeParse(answers).success, true);
  assert.equal(schema.safeParse({ unknown: { choice: '예', private: true } }).success, false);
  assert.equal(schema.safeParse({ Q0: { choice: '변조된 선택지', private: true } }).success, false);
});

test('corporate review permits small companies without a website when evidence is supplied', () => {
  assert.equal(
    company.companyEmailReviewSchema.safeParse({
      company: '작은 회사',
      website: '',
      evidence: '회사 소속을 확인할 수 있는 자료에 대한 상세한 설명입니다.',
    }).success,
    true,
  );
  assert.equal(
    company.companyEmailReviewSchema.safeParse({
      company: '작은 회사',
      website: '',
      evidence: '짧음',
    }).success,
    false,
  );
  assert.equal(company.workEmailCodeSchema.safeParse({ code: '12345x' }).success, false);
});

test('company URLs and domains reject credential URLs, schemes and paths', () => {
  for (const domain of [
    'https://company.test',
    'user@company.test',
    '*.company.test',
    'company.test/path',
    '127.0.0.1',
  ])
    assert.equal(company.companyDomainSchema.safeParse(domain).success, false);
  assert.equal(company.companyDomainSchema.parse(' COMPANY.TEST '), 'company.test');
  const input = {
    company: '회사',
    domain: 'company.test',
    website: 'https://user:password@company.test',
    note: '확인',
  };
  assert.equal(company.companyDomainRegistrationSchema.safeParse(input).success, false);
});

test('admin reason requirements depend on the selected decision', () => {
  assert.equal(
    admin.photoReviewSchema.safeParse({
      status: 'APPROVED',
      reason: '',
      photos: [photo(1), photo(2), photo(3)],
    }).success,
    true,
  );
  assert.equal(
    admin.photoReviewSchema.safeParse({ status: 'REJECTED', reason: '   ', photos: [photo(1)] })
      .success,
    false,
  );
  assert.equal(admin.reportReviewSchema.safeParse({ status: 'VALID', note: '   ' }).success, false);
  assert.equal(
    admin.questionDraftSchema.safeParse({
      section: '가치관',
      text: '질문',
      purpose: '매칭',
      options: ['하나', ' 하나 ', '셋', '넷'],
    }).success,
    false,
  );
});

test('preset validation handles integer bounds, totals and existing seeded UUIDs', () => {
  assert.equal(matching.matchingPresetSchema.parse(preset).name, '균형형');
  assert.equal(
    matching.matchingPresetSchema.safeParse({ ...preset, valuesWeight: 40.5 }).success,
    false,
  );
  assert.equal(
    matching.matchingPresetSchema.safeParse({ ...preset, valuesWeight: 101, contactWeight: -31 })
      .success,
    false,
  );
  assert.equal(
    matching.matchingActivationSchema.safeParse({ id: '00000000-0000-0000-0000-000000000002' })
      .success,
    true,
  );
});

test('React Hook Form resolver returns transformed values and nested validation errors', async () => {
  const resolve = zodResolver(matching.matchingPresetSchema);
  const options = { fields: {}, shouldUseNativeValidation: false, criteriaMode: 'firstError' };
  const valid = await resolve(preset, undefined, options);
  assert.equal(valid.values.name, '균형형');
  assert.deepEqual(valid.errors, {});
  const invalid = await resolve({ ...preset, valuesWeight: 39 }, undefined, options);
  assert.equal(invalid.errors.valuesWeight.message, '가중치 합계를 100%로 맞춰 주세요.');
  assert.deepEqual(invalid.values, {});
});

test('invalid member and admin requests stop before CSRF or network calls', async () => {
  const { api } = await loadTypeScript(new URL('../src/lib/api.ts', import.meta.url));
  const { adminApi } = await loadTypeScript(new URL('../src/pages/admin/api.ts', import.meta.url));
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error('must not fetch');
  };
  try {
    await assert.rejects(
      api.login('bad', 'password'),
      (error) => error.name === 'FormValidationError' && !!error.fields.email,
    );
    await assert.rejects(
      adminApi.createMatchingPreset({ ...preset, contactWeight: 29 }),
      (error) => error.name === 'FormValidationError',
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test('validation errors expose the same Korean message and field path to forms and API callers', () => {
  assert.throws(
    () => forms.parseForm(company.workEmailCodeSchema, { code: '1' }),
    (error) =>
      error.message === '인증번호 6자리를 입력해 주세요.' && error.fields.code === error.message,
  );
});
