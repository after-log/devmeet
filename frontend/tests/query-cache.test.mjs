import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryObserver } from '@tanstack/react-query';
import { loadTypeScriptModules } from './helpers/load-typescript.mjs';

async function setup(t) {
  const [cache, { ApiError }, keys] = await loadTypeScriptModules([
    new URL('../src/lib/query-client.ts', import.meta.url),
    new URL('../src/lib/api-error.ts', import.meta.url),
    new URL('../src/lib/query-keys.ts', import.meta.url),
  ]);
  t.after(() => cache.queryClient.clear());
  return { ...cache, ApiError, ...keys };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('concurrent consumers share a request and reuse fresh server data', async (t) => {
  const { queryClient: client, queryKeys } = await setup(t);
  let calls = 0;
  let resolve;
  const options = {
    queryKey: queryKeys.member.account('alice')._ctx.snapshot.queryKey,
    queryFn: () => {
      calls++;
      return new Promise((done) => {
        resolve = done;
      });
    },
  };
  const first = client.fetchQuery(options);
  const second = client.fetchQuery(options);
  resolve({ likes: 3 });
  assert.deepEqual(await first, { likes: 3 });
  assert.deepEqual(await second, { likes: 3 });
  assert.deepEqual(await client.fetchQuery(options), { likes: 3 });
  assert.equal(calls, 1);
});

test('invalidation refreshes active queries and preserves unrelated cached data', async (t) => {
  const { queryClient: client, queryKeys } = await setup(t);
  let source = 1;
  const key = queryKeys.admin.account('operator')._ctx.matching.queryKey;
  const options = { queryKey: key, queryFn: async () => ({ version: source }) };
  await client.fetchQuery(options);
  client.setQueryData(queryKeys.public.providers.queryKey, { kakao: true });
  const observer = new QueryObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  t.after(unsubscribe);
  source = 2;
  await client.invalidateQueries({ queryKey: queryKeys.admin._def });
  assert.deepEqual(client.getQueryData(key), { version: 2 });
  assert.deepEqual(client.getQueryData(queryKeys.public.providers.queryKey), { kakao: true });
});

test('logout cancels pending data and removes only the logged out scope', async (t) => {
  const { queryClient: client, clearQueryScope, queryKeys } = await setup(t);
  client.setQueryData(queryKeys.member.account('alice')._ctx.blocks.queryKey, ['private']);
  client.setQueryData(queryKeys.admin.account('operator')._ctx.directory.queryKey, ['staff']);
  let resolve;
  const request = client.fetchQuery({
    queryKey: queryKeys.member.account('alice')._ctx.messages('peer')._ctx.page().queryKey,
    queryFn: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  const cancelled = assert.rejects(request);
  await clearQueryScope('member');
  resolve(['late private response']);
  await cancelled;
  await tick();
  assert.equal(client.getQueriesData({ queryKey: queryKeys.member._def }).length, 0);
  assert.deepEqual(
    client.getQueryData(queryKeys.admin.account('operator')._ctx.directory.queryKey),
    ['staff'],
  );
});

test('account ids keep one member’s cache separate from another member', async (t) => {
  const { queryClient: client, queryKeys } = await setup(t);
  client.setQueryData(queryKeys.member.account('alice')._ctx.workEmail.queryKey, {
    email: 'alice@company.test',
  });
  assert.equal(
    client.getQueryData(queryKeys.member.account('bob')._ctx.workEmail.queryKey),
    undefined,
  );
});

test('401 expires the affected session and clears private query data', async (t) => {
  const { queryClient: client, ApiError, queryKeys } = await setup(t);
  client.setQueryData(queryKeys.member.session.queryKey, { user: { id: 'alice' } });
  client.setQueryData(queryKeys.member.account('alice')._ctx.blocks.queryKey, ['private']);
  client.setQueryData(queryKeys.admin.session.queryKey, { authenticated: true });
  await assert.rejects(
    client.fetchQuery({
      queryKey: queryKeys.member.account('alice')._ctx.snapshot.queryKey,
      queryFn: async () => {
        throw new ApiError(401, '로그인이 필요해요.');
      },
    }),
  );
  await tick();
  assert.deepEqual(client.getQueryData(queryKeys.member.session.queryKey), { user: null });
  assert.equal(
    client.getQueryData(queryKeys.member.account('alice')._ctx.blocks.queryKey),
    undefined,
  );
  assert.deepEqual(client.getQueryData(queryKeys.admin.session.queryKey), { authenticated: true });
});

test('validation failures and mutation failures are not automatically retried', async (t) => {
  const { queryClient: client, ApiError, queryKeys } = await setup(t);
  let reads = 0;
  await assert.rejects(
    client.fetchQuery({
      queryKey: queryKeys.public.valueCatalog.queryKey,
      queryFn: async () => {
        reads++;
        throw new ApiError(400, '잘못된 요청');
      },
    }),
  );
  let writes = 0;
  const mutation = client.getMutationCache().build(client, {
    mutationFn: async () => {
      writes++;
      throw new Error('connection lost');
    },
  });
  await assert.rejects(mutation.execute(undefined));
  assert.equal(reads, 1);
  assert.equal(writes, 1);
});

test('account invalidation reaches every chat page without touching other accounts or sessions', async (t) => {
  const { queryClient: client, queryKeys } = await setup(t);
  const latest = queryKeys.member.account('alice')._ctx.messages('peer')._ctx.page().queryKey;
  const older = queryKeys.member
    .account('alice')
    ._ctx.messages('peer')
    ._ctx.page('cursor-2').queryKey;
  const other = queryKeys.member.account('bob')._ctx.messages('peer')._ctx.page().queryKey;
  for (const key of [latest, older, other, queryKeys.member.session.queryKey])
    client.setQueryData(key, {});
  await client.invalidateQueries({
    queryKey: queryKeys.member.account('alice')._ctx.messages('peer').queryKey,
  });
  assert.equal(client.getQueryState(latest).isInvalidated, true);
  assert.equal(client.getQueryState(older).isInvalidated, true);
  assert.equal(client.getQueryState(other).isInvalidated, false);
  assert.equal(client.getQueryState(queryKeys.member.session.queryKey).isInvalidated, false);
});

test('admin invalidation excludes the session and keeps statistics periods separate', async (t) => {
  const { queryClient: client, queryKeys, isSessionQueryKey } = await setup(t);
  const week = queryKeys.admin.account('operator')._ctx.statistics(7).queryKey;
  const month = queryKeys.admin.account('operator')._ctx.statistics(30).queryKey;
  client.setQueryData(queryKeys.admin.session.queryKey, { authenticated: true });
  client.setQueryData(week, { signups: 7 });
  client.setQueryData(month, { signups: 30 });
  await client.invalidateQueries({
    queryKey: queryKeys.admin._def,
    predicate: (query) => !isSessionQueryKey(query.queryKey),
  });
  assert.equal(client.getQueryState(queryKeys.admin.session.queryKey).isInvalidated, false);
  assert.equal(client.getQueryState(week).isInvalidated, true);
  assert.equal(client.getQueryState(month).isInvalidated, true);
  assert.deepEqual(client.getQueryData(week), { signups: 7 });
  assert.deepEqual(client.getQueryData(month), { signups: 30 });
});

test('feature mutation keys still expire the correct session on 401', async (t) => {
  const { queryClient: client, queryKeys, mutationKeys, ApiError } = await setup(t);
  client.setQueryData(queryKeys.member.session.queryKey, { user: { id: 'alice' } });
  client.setQueryData(queryKeys.admin.session.queryKey, { authenticated: true });
  const mutation = client.getMutationCache().build(client, {
    mutationKey: mutationKeys.member.profile('alice').mutationKey,
    mutationFn: async () => {
      throw new ApiError(401, '로그인이 필요해요.');
    },
  });
  await assert.rejects(mutation.execute(undefined));
  await tick();
  assert.deepEqual(client.getQueryData(queryKeys.member.session.queryKey), { user: null });
  assert.deepEqual(client.getQueryData(queryKeys.admin.session.queryKey), { authenticated: true });
});
