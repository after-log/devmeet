import { axios } from './axios';
export { ApiError } from './api-error';
import type {
  Connections,
  EditableProfileField,
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
export const api = {
  me: () => request<{ user: User | null }>('/me'),
  register: (email: string, password: string) =>
    request<{ user: User }>('/register', 'POST', { email, password }),
  login: (email: string, password: string) =>
    request<{ user: User }>('/login', 'POST', { email, password }),
  logout: () => request<void>('/logout', 'POST'),
  saveProfile: (input: Partial<Profile>) => request<{ profile: Profile }>('/profile', 'PUT', input),
  updateProfileField: (field: EditableProfileField, value: unknown) =>
    request<{ profile: Profile }>(`/profile/${field}`, 'PATCH', { value }),
  saveValues: (valueAnswers: ValueAnswers) =>
    request<{ profile: Profile }>('/profile/values', 'PUT', { valueAnswers }),
  photo: (form: FormData) => request<{ photo: string }>('/photo', 'POST', form),
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
  block: (id: string) => request<void>('/block', 'POST', { id }),
  unblock: (id: string) => request<void>('/blocks/' + id, 'DELETE'),
  blocks: () => request<{ people: Person[] }>('/blocks'),
  person: (id: string) => request<{ person: Person }>('/people/' + id),
  authCapabilities: () =>
    request<{ email: boolean; localPasswordLogin: boolean }>('/auth/capabilities'),
  providers: () => request<Record<'github' | 'kakao', boolean>>('/auth/providers'),
  link: (provider: 'github' | 'kakao') =>
    request<{ url: string }>('/auth/' + provider + '/link', 'POST'),
};
