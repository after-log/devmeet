import type {
  Connections,
  Message,
  Person,
  Profile,
  Recommendations,
  User,
  ValueAnswers,
} from '@/types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
let csrf: Promise<{ token: string; headerName: string }> | null = null;
async function token() {
  if (!csrf)
    csrf = fetch('/api/csrf', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new ApiError(response.status, '서버에 연결할 수 없어요.');
        return response.json();
      })
      .catch((error) => {
        csrf = null;
        throw error;
      });
  return csrf;
}
export async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {};
  const changing = !['GET', 'HEAD'].includes(method);
  if (changing) {
    const value = await token();
    headers[value.headerName] = value.token;
  }
  if (body !== undefined && !(body instanceof FormData))
    headers['Content-Type'] = 'application/json';
  let response: Response;
  try {
    response = await fetch('/api' + path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
  }
  const data = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    if (retry && response.status === 403 && data?.message?.includes('CSRF')) {
      csrf = null;
      return request(path, method, body, false);
    }
    const first = data?.errors?.[0];
    throw new ApiError(
      response.status,
      first?.message || data?.message || '요청을 처리하지 못했어요.',
    );
  }
  return data as T;
}
async function authenticate(path: string, email: string, password: string) {
  try {
    return await request<{ user: User }>(path, 'POST', { email, password });
  } finally {
    csrf = null;
  }
}
const profileKeys: (keyof Profile)[] = [
  'name',
  'age',
  'height',
  'location',
  'job',
  'education',
  'role',
  'meeting',
  'contact',
  'preference',
  'smoking',
  'drinking',
  'religion',
  'intro',
  'tags',
  'photo',
  'minAge',
  'maxAge',
  'region',
  'valueAnswers',
];

export const api = {
  me: () => request<{ user: User | null }>('/me'),
  register: (email: string, password: string) => authenticate('/register', email, password),
  login: (email: string, password: string) => authenticate('/login', email, password),
  logout: async () => {
    try {
      await request<void>('/logout', 'POST');
    } finally {
      csrf = null;
    }
  },
  saveProfile: (input: Partial<Profile>) =>
    request<{ profile: Profile }>('/profile', 'PUT', {
      preference: '상관없어요',
      tags: [],
      minAge: 19,
      maxAge: 60,
      region: '',
      ...Object.fromEntries(
        profileKeys.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]),
      ),
    }),
  saveValues: (valueAnswers: ValueAnswers) =>
    request<{ profile: Profile }>('/profile/values', 'PUT', { valueAnswers }),
  photo: async (file: File) => {
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    )
      throw new ApiError(400, '10MB 이하의 JPEG·PNG·WebP 사진을 선택해 주세요.');
    const image = await createImageBitmap(file);
    if (image.width * image.height > 40_000_000) {
      image.close();
      throw new ApiError(400, '사진 해상도가 너무 커요.');
    }
    const ratio = Math.min(1, 640 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('사진을 처리하지 못했어요.'))),
        'image/jpeg',
        0.85,
      ),
    );
    const form = new FormData();
    form.append('file', blob, 'profile.jpg');
    return request<{ photo: string }>('/photo', 'POST', form);
  },
  recommendations: () => request<Recommendations>('/recommendations'),
  like: (id: string) => request<{ matched: boolean }>('/likes', 'POST', { id }),
  connections: () => request<Connections>('/connections'),
  messages: (id: string, before?: string) =>
    request<{ messages: Message[]; nextCursor: string | null }>(
      `/messages/${id}${before ? '?before=' + encodeURIComponent(before) : ''}`,
    ),
  send: (id: string, text: string) =>
    request<{ message: Message }>('/messages/' + id, 'POST', { text }),
  report: (id: string, reason: string) =>
    request<{ id: string }>('/report', 'POST', { id, reason }),
  block: (id: string, remove = false) =>
    remove ? request<void>('/blocks/' + id, 'DELETE') : request<void>('/block', 'POST', { id }),
  blocks: () => request<{ people: Person[] }>('/blocks'),
  person: (id: string) => request<{ person: Person }>('/people/' + id),
  providers: () => request<Record<'github' | 'kakao', boolean>>('/auth/providers'),
  link: (provider: 'github' | 'kakao') =>
    request<{ url: string }>('/auth/' + provider + '/link', 'POST'),
};
