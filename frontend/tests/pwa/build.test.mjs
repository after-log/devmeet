import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const dist = new URL('../../dist/', import.meta.url);
// This suite deliberately inspects production output. Run npm run build first.
const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', dist), 'utf8'));
const sw = await readFile(new URL('sw.js', dist), 'utf8');
const calls = { precache: [], routes: [], messages: [], skipped: false };
const workbox = {
  precacheAndRoute: (entries) => {
    calls.precache = entries;
  },
  cleanupOutdatedCaches: () => {},
  createHandlerBoundToURL: (url) => ({ url }),
  NavigationRoute: class {
    constructor(handler, options) {
      Object.assign(this, { handler, ...options });
    }
  },
  registerRoute: (route) => calls.routes.push(route),
};
const swContext = {
  define: (_dependencies, factory) => factory(workbox),
  addEventListener: (event, callback) => calls.messages.push({ event, callback }),
  skipWaiting: () => {
    calls.skipped = true;
  },
};
swContext.self = swContext;
vm.runInNewContext(sw, swContext);

test('manifest launches a standalone app with valid standard and maskable PNG icons', async () => {
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.id, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    const png = await readFile(new URL(icon.src.slice(1), dist));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});

test('offline cache contains existing app assets and excludes API data and user photos', async () => {
  assert.ok(calls.precache.some((entry) => entry.url === 'index.html'));
  assert.ok(calls.precache.some((entry) => entry.url.startsWith('assets/')));
  assert.equal(new Set(calls.precache.map((entry) => entry.url)).size, calls.precache.length);
  for (const entry of calls.precache) {
    assert.match(
      entry.url,
      /^(?:assets\/|icons\/|index\.html$|manifest\.webmanifest$|favicon\.svg$)/,
    );
    await readFile(new URL(entry.url, dist));
  }
});

test('navigation fallback excludes API and OAuth routes while allowing application deep links', () => {
  assert.equal(calls.routes.length, 1);
  const { handler, denylist } = calls.routes[0];
  assert.equal(handler.url, 'index.html');
  for (const path of [
    '/api',
    '/api/me',
    '/api/photos/123',
    '/api/events',
    '/oauth2/authorization/github',
    '/login/oauth2/code/github',
  ]) {
    assert.ok(
      denylist.some((rule) => rule.test(path)),
      path,
    );
  }
  for (const path of ['/', '/today', '/chat/123', '/auth/login', '/me/values']) {
    assert.equal(
      denylist.some((rule) => rule.test(path)),
      false,
      path,
    );
  }
});

test('new service workers wait for user approval before activating', () => {
  assert.equal(calls.skipped, false);
  const listener = calls.messages.find(({ event }) => event === 'message');
  assert.ok(listener);
  listener.callback({ data: { type: 'SOME_OTHER_MESSAGE' } });
  assert.equal(calls.skipped, false);
  listener.callback({ data: { type: 'SKIP_WAITING' } });
  assert.equal(calls.skipped, true);
});
