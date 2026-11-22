import { axios } from './axios';
export { ApiError } from './api-error';
import { parseForm } from '@/validation/forms';
import { photoFileSchema, photoDimensionsSchema } from '@/validation/profile';
import type {
  Connections,
  Message,
  Person,
  Profile,
  Recommendations,
  User,
  ValueAnswers,
} from '@/types';

export async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  retry = true,
): Promise<T> {
  const response = await axios.request<T>({ url: path, method, data: body, csrfRetried: !retry });
  return response.data;
}
function authenticate(path: string, email: string, password: string) {
  return request<{ user: User }>(path, 'POST', { email, password });
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
  'photos',
  'minAge',
  'maxAge',
  'region',
  'valueAnswers',
];

export const api = {
  me: () => request<{ user: User | null }>('/me'),
  register: (email: string, password: string) => authenticate('/register', email, password),
  login: (email: string, password: string) => authenticate('/login', email, password),
  logout: () => request<void>('/logout', 'POST'),
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
    parseForm(photoFileSchema, file);
    const image = await createImageBitmap(file);
    try {
      parseForm(photoDimensionsSchema, { width: image.width, height: image.height });
    } catch (error) {
      image.close();
      throw error;
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
