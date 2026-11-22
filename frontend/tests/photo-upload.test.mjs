import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-typescript.mjs';
import { mockClient } from './helpers/mock-axios.mjs';

const { preparePhotoUpload } = await loadTypeScript(
  new URL('../src/hooks/queries/usePhotoUpload.ts', import.meta.url),
);

function stubGlobal(t, name, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, name, previous);
    else delete globalThis[name];
  });
}

function setupImage(t, width, height, contextAvailable = true) {
  const operations = [];
  const image = { width, height, close: () => operations.push('close') };
  const context = {
    fillStyle: '',
    fillRect: (...args) => operations.push(['fill', context.fillStyle, ...args]),
    drawImage: (...args) => operations.push(['draw', ...args]),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => (contextAvailable ? context : null),
    toBlob: (callback, type, quality) => {
      operations.push(['encode', type, quality]);
      callback(new Blob(['encoded-image'], { type }));
    },
  };
  stubGlobal(t, 'createImageBitmap', async () => image);
  stubGlobal(t, 'document', { createElement: () => canvas });
  return { image, canvas, operations };
}
const file = () => new File(['image'], 'original.png', { type: 'image/png' });

test('photo preparation scales to 640px, flattens transparency and produces JPEG multipart data', async (t) => {
  const { image, canvas, operations } = setupImage(t, 1600, 1200);
  const form = await preparePhotoUpload(file());
  assert.equal(canvas.width, 640);
  assert.equal(canvas.height, 480);
  assert.deepEqual(operations, [
    ['fill', '#fff', 0, 0, 640, 480],
    ['draw', image, 0, 0, 640, 480],
    'close',
    ['encode', 'image/jpeg', 0.85],
  ]);
  const upload = form.get('file');
  assert.equal(upload.name, 'profile.jpg');
  assert.equal(upload.type, 'image/jpeg');
});

test('photo preparation keeps smaller images at their original dimensions', async (t) => {
  const { canvas } = setupImage(t, 240, 320);
  await preparePhotoUpload(file());
  assert.equal(canvas.width, 240);
  assert.equal(canvas.height, 320);
});

test('invalid files fail before decoding', async (t) => {
  let decoded = false;
  stubGlobal(t, 'createImageBitmap', async () => {
    decoded = true;
  });
  await assert.rejects(
    preparePhotoUpload(new File(['bad'], 'file.txt', { type: 'text/plain' })),
    /JPEG/,
  );
  assert.equal(decoded, false);
});

test('excessive dimensions release the bitmap', async (t) => {
  const { operations } = setupImage(t, 8000, 6000);
  await assert.rejects(preparePhotoUpload(file()), /해상도/);
  assert.deepEqual(operations, ['close']);
});

test('canvas failures release the bitmap and report a usable error', async (t) => {
  const { operations } = setupImage(t, 640, 480, false);
  await assert.rejects(preparePhotoUpload(file()), /사진을 처리하지 못했어요/);
  assert.deepEqual(operations, ['close']);
});

test('photo API uploads prepared multipart data without requiring browser image APIs', async () => {
  const form = new FormData();
  form.append('file', new Blob(['jpeg'], { type: 'image/jpeg' }), 'profile.jpg');
  const { api } = await mockClient(
    new URL('../src/lib/api.ts', import.meta.url),
    async (path, options) => {
      if (path === '/api/csrf')
        return new Response(JSON.stringify({ token: 'token', headerName: 'X-CSRF-TOKEN' }));
      assert.equal(path, '/api/photo');
      assert.equal(options.method, 'POST');
      assert.equal(options.body, form);
      return new Response(JSON.stringify({ photo: '/api/photos/uploaded' }));
    },
  );
  assert.deepEqual(await api.photo(form), { photo: '/api/photos/uploaded' });
});
