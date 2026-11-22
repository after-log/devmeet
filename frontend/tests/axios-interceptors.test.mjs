import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError, isCancel } from 'axios';
import { mockClient } from './helpers/mock-axios.mjs';

const entry = new URL('../src/lib/api.ts', import.meta.url);
const adminEntry = new URL('../src/pages/admin/api.ts', import.meta.url);
const response = (data, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const csrf = (token = 'token', headerName = 'X-CSRF-TOKEN') => response({ token, headerName });

test('the axios instance applies schema normalization, credentials and CSRF headers', async () => {
  const calls = [];
  const { axios } = await mockClient(entry, async (path, options) => {
    calls.push(path);
    assert.equal(options.withCredentials, true);
    assert.equal(options.headers['Cache-Control'], 'no-cache, no-store');
    if (path === '/api/csrf') return csrf();
    assert.equal(options.headers['X-CSRF-TOKEN'], 'token');
    assert.deepEqual(JSON.parse(options.body), { company: '회사', email: 'member@company.test' });
    return response({ ok: true });
  });
  assert.equal(axios.defaults.baseURL, '/api');
  assert.deepEqual(
    (await axios.post('/work-email/request', { company: ' 회사 ', email: ' MEMBER@Company.test ' }))
      .data,
    { ok: true },
  );
  assert.deepEqual(calls, ['/api/csrf', '/api/work-email/request']);
});

test('GET requests do not fetch a CSRF token', async () => {
  const { api } = await mockClient(entry, async (path, options) => {
    assert.equal(path, '/api/recommendations');
    assert.equal(options.headers['X-CSRF-TOKEN'], undefined);
    return response({ people: [] });
  });
  assert.deepEqual(await api.recommendations(), { people: [] });
});

test('parallel mutations share a single initial CSRF request', async () => {
  let tokens = 0,
    mutations = 0;
  const { api } = await mockClient(entry, async (path, options) => {
    if (path === '/api/csrf') {
      tokens++;
      return csrf();
    }
    mutations++;
    assert.equal(options.headers['X-CSRF-TOKEN'], 'token');
    return response({ profile: {} });
  });
  await Promise.all([api.saveValues({}), api.saveValues({}), api.saveValues({})]);
  assert.equal(tokens, 1);
  assert.equal(mutations, 3);
});

test('parallel stale-token errors share one refresh and preserve serialized request bodies', async () => {
  let tokens = 0,
    stale = 0,
    retried = 0,
    release;
  const barrier = new Promise((resolve) => {
    release = resolve;
  });
  const { api } = await mockClient(entry, async (path, options) => {
    if (path === '/api/csrf') return csrf('token-' + ++tokens);
    assert.deepEqual(JSON.parse(options.body), { valueAnswers: {} });
    if (options.headers['X-CSRF-TOKEN'] === 'token-1') {
      if (++stale === 2) release();
      await barrier;
      return response({ message: 'CSRF 토큰 확인' }, 403);
    }
    retried++;
    assert.equal(options.headers['X-CSRF-TOKEN'], 'token-2');
    return response({ profile: {} });
  });
  await Promise.all([api.saveValues({}), api.saveValues({})]);
  assert.equal(tokens, 2);
  assert.equal(stale, 2);
  assert.equal(retried, 2);
});

test('persistent CSRF failures retry only once and regular 403 responses never retry', async () => {
  for (const message of ['CSRF 토큰 확인', '관리자 권한이 필요해요.']) {
    let tokens = 0,
      attempts = 0;
    const { api, ApiError } = await mockClient(entry, async (path) => {
      if (path === '/api/csrf') {
        tokens++;
        return csrf();
      }
      attempts++;
      return response({ message }, 403);
    });
    await assert.rejects(
      api.saveValues({}),
      (error) => error instanceof ApiError && error.status === 403 && error.message === message,
    );
    assert.equal(attempts, message.includes('CSRF') ? 2 : 1);
    assert.equal(tokens, attempts);
  }
});

test('member and admin token caches stay separate when admin authentication rotates', async () => {
  let memberTokens = 0,
    adminTokens = 0;
  const { axios, adminApi } = await mockClient(adminEntry, async (path, options) => {
    if (path === '/api/csrf') return csrf('member-' + ++memberTokens);
    if (path === '/api/admin/auth/csrf') return csrf('admin-' + ++adminTokens);
    if (!path.startsWith('/api/admin/')) assert.equal(options.headers['X-CSRF-TOKEN'], 'member-1');
    else
      assert.equal(
        options.headers['X-CSRF-TOKEN'],
        path === '/api/admin/auth/login' ? 'admin-1' : 'admin-2',
      );
    return response({});
  });
  await axios.put('/profile/values', { valueAnswers: {} });
  await adminApi.login('operator', 'password');
  await axios.put('/profile/values', { valueAnswers: {} });
  await adminApi.activateQuestion({ id: 'Q1', active: true });
  assert.equal(memberTokens, 1);
  assert.equal(adminTokens, 2);
});

test('failed authentication also invalidates its cached token', async () => {
  let tokens = 0;
  const { api } = await mockClient(entry, async (path, options) => {
    if (path === '/api/csrf') return csrf('token-' + ++tokens);
    if (path === '/api/login') return response({ message: '로그인 실패' }, 401);
    assert.equal(options.headers['X-CSRF-TOKEN'], 'token-2');
    return response({});
  });
  await assert.rejects(
    api.login('member@example.test', 'password'),
    (error) => error.status === 401,
  );
  await api.saveValues({});
  assert.equal(tokens, 2);
});

test('a failed CSRF fetch does not poison subsequent requests', async () => {
  let tokens = 0;
  const { api } = await mockClient(entry, async (path) => {
    if (path === '/api/csrf')
      return ++tokens === 1 ? response({ message: 'Unavailable' }, 503) : csrf();
    return response({ profile: {} });
  });
  await assert.rejects(api.saveValues({}), (error) => error.status === 503);
  await api.saveValues({});
  assert.equal(tokens, 2);
});

test('server field errors and network failures retain the ApiError contract', async () => {
  const { api, ApiError } = await mockClient(entry, async (path, options) => {
    if (path === '/api/recommendations')
      return response({ message: '실패', errors: [{ message: '필드 오류' }] }, 422);
    throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, options.config);
  });
  await assert.rejects(
    api.recommendations(),
    (error) => error instanceof ApiError && error.status === 422 && error.message === '필드 오류',
  );
  await assert.rejects(
    api.me(),
    (error) =>
      error instanceof ApiError && error.status === 0 && error.message.includes('서버에 연결'),
  );
});

test('FormData is preserved on CSRF retry, and 204 responses return undefined', async () => {
  const form = new FormData();
  form.append('file', new Blob(['photo'], { type: 'image/jpeg' }), 'photo.jpg');
  let attempts = 0,
    tokens = 0;
  const { axios } = await mockClient(entry, async (path, options) => {
    if (path === '/api/csrf') return csrf('token-' + ++tokens);
    assert.equal(options.body, form);
    assert.notEqual(options.headers['Content-Type'], 'application/json');
    if (++attempts === 1) return response({ message: 'CSRF 토큰 확인' }, 403);
    return response(undefined, 204);
  });
  assert.equal((await axios.post('/photo', form)).data, undefined);
  assert.equal(attempts, 2);
  assert.equal(tokens, 2);
});

test('canceled requests retain Axios cancellation semantics without dispatching', async () => {
  const { axios } = await mockClient(entry, async () => {
    throw new Error('must not dispatch');
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(axios.get('/me', { signal: controller.signal }), (error) => isCancel(error));
});
