import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const shared = compile(await readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8'));
const sharedUrl = 'data:text/javascript;base64,' + Buffer.from(shared).toString('base64');
const source = compile(
  await readFile(new URL('../src/pages/admin/api.ts', import.meta.url), 'utf8'),
).replace("'@/lib/api'", JSON.stringify(sharedUrl));
let version = 0;
const client = () =>
  import('data:text/javascript;base64,' + Buffer.from(source).toString('base64') + '#' + version++);
const response = (data, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

test('admin credentials use the operator CSRF endpoint and rotate tokens after login', async () => {
  const original = globalThis.fetch;
  const paths = [];
  let tokens = 0;
  globalThis.fetch = async (path, options) => {
    paths.push(path);
    if (path === '/api/admin/auth/csrf')
      return response({ headerName: 'X-CSRF-TOKEN', token: 'operator-' + ++tokens });
    if (path === '/api/admin/auth/login') {
      assert.equal(options.headers['X-CSRF-TOKEN'], 'operator-1');
      assert.deepEqual(JSON.parse(options.body), { id: 'operator', password: 'password' });
      return response({ authenticated: true, username: 'operator' });
    }
    assert.equal(path, '/api/admin/questions/Q1');
    assert.equal(options.headers['X-CSRF-TOKEN'], 'operator-2');
    assert.deepEqual(JSON.parse(options.body), { active: false });
    return response(undefined, 204);
  };
  try {
    const { adminApi } = await client();
    await adminApi.login('operator', 'password');
    await adminApi.activateQuestion({ id: 'Q1', active: true });
    assert.equal(tokens, 2);
    assert.ok(paths.every((path) => path.startsWith('/api/admin/')));
  } finally {
    globalThis.fetch = original;
  }
});

test('photo review sends original photo URLs instead of operator previews', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (path, options) => {
    if (path.endsWith('/csrf')) return response({ headerName: 'X-CSRF-TOKEN', token: 'token' });
    assert.equal(path, '/api/admin/photos/member-id');
    assert.deepEqual(JSON.parse(options.body), {
      status: 'APPROVED',
      reason: '확인',
      photos: ['/api/photos/photo-id'],
    });
    return response(undefined, 204);
  };
  try {
    const { adminApi } = await client();
    await adminApi.reviewProfile(
      {
        id: 'member-id',
        photos: ['/api/admin/photo-files/photo-id'],
        reviewPhotos: ['/api/photos/photo-id'],
      },
      'APPROVED',
      '확인',
    );
  } finally {
    globalThis.fetch = original;
  }
});

test('expired operator CSRF retries once and server failures remain errors', async () => {
  const original = globalThis.fetch;
  let csrf = 0,
    attempts = 0;
  globalThis.fetch = async (path, options) => {
    if (path.endsWith('/csrf'))
      return response({ headerName: 'X-CSRF-TOKEN', token: 'token-' + ++csrf });
    attempts++;
    if (attempts === 1) return response({ message: 'CSRF 토큰을 확인해 주세요.' }, 403);
    assert.equal(options.headers['X-CSRF-TOKEN'], 'token-2');
    return response({ message: '저장 실패' }, 500);
  };
  try {
    const { adminApi } = await client();
    await assert.rejects(
      adminApi.addQuestion({}),
      (error) => error.status === 500 && error.message === '저장 실패',
    );
    assert.equal(attempts, 2);
    assert.equal(csrf, 2);
  } finally {
    globalThis.fetch = original;
  }
});
