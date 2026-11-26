import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockClient } from './helpers/mock-axios.mjs';

const client = () => mockClient(new URL('../src/lib/api.ts', import.meta.url));
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

test('onboarding sends required defaults and excludes UI-only draft fields', async () => {
  const original = globalThis.fetch;
  let sent;
  globalThis.fetch = async (url, options) => {
    if (url === '/api/csrf') return response({ token: 'csrf-1', headerName: 'X-CSRF-TOKEN' });
    assert.equal(url, '/api/profile');
    assert.equal(options.headers['X-CSRF-TOKEN'], 'csrf-1');
    sent = JSON.parse(options.body);
    return response({ profile: sent });
  };
  try {
    const { api } = await client();
    await api.saveProfile({
      name: '지원',
      age: 28,
      gender: '여성',
      height: 170,
      location: '서울시 성동구',
      job: '개발자',
      education: '대학교',
      role: 'developer',
      meeting: '주 1회',
      contact: '매일',
      smoking: '비흡연',
      drinking: '가끔',
      religion: '무교',
      intro: '자기소개',
      city: '서울시',
      district: '성동구',
      tagsText: '산책',
      photos: [
        '/api/photos/00000000-0000-4000-8000-000000000001',
        '/api/photos/00000000-0000-4000-8000-000000000002',
        '/api/photos/00000000-0000-4000-8000-000000000003',
      ],
    });
    assert.deepEqual(sent.photos, [
      '/api/photos/00000000-0000-4000-8000-000000000001',
      '/api/photos/00000000-0000-4000-8000-000000000002',
      '/api/photos/00000000-0000-4000-8000-000000000003',
    ]);
    assert.equal(sent.region, '');
    assert.equal(sent.gender, '여성');
    assert.equal(sent.minAge, 19);
    assert.equal(sent.maxAge, 60);
    assert.deepEqual(sent.tags, []);
    assert.equal('city' in sent, false);
    assert.equal('district' in sent, false);
    assert.equal('tagsText' in sent, false);
  } finally {
    globalThis.fetch = original;
  }
});

test('login rotates cached CSRF token before the next authenticated mutation', async () => {
  const original = globalThis.fetch;
  let tokens = 0;
  globalThis.fetch = async (url, options) => {
    if (url === '/api/csrf')
      return response({ token: 'csrf-' + ++tokens, headerName: 'X-CSRF-TOKEN' });
    assert.equal(options.headers['X-CSRF-TOKEN'], url === '/api/login' ? 'csrf-1' : 'csrf-2');
    return response(url === '/api/login' ? { user: { id: 'member' } } : { profile: {} });
  };
  try {
    const { api } = await client();
    await api.login('member@example.test', 'test-only-password');
    await api.saveValues({});
    assert.equal(tokens, 2);
  } finally {
    globalThis.fetch = original;
  }
});

test('expired CSRF is refreshed once and a server error is never replaced with mock data', async () => {
  const original = globalThis.fetch;
  let tokens = 0,
    mutations = 0;
  globalThis.fetch = async (url) => {
    if (url === '/api/csrf')
      return response({ token: 'csrf-' + ++tokens, headerName: 'X-CSRF-TOKEN' });
    if (url === '/api/profile/values')
      return ++mutations === 1
        ? response({ message: 'CSRF 토큰 확인' }, 403)
        : response({ profile: {} });
    return response({ message: '서버 오류' }, 503);
  };
  try {
    const { api } = await client();
    await api.saveValues({});
    assert.equal(tokens, 2);
    assert.equal(mutations, 2);
    await assert.rejects(api.recommendations(), (error) => error.status === 503);
  } finally {
    globalThis.fetch = original;
  }
});
