import { ApiError } from '@/lib/api';
import type { Category, Member, Question, QuestionDraft, Report, ReviewStatus } from './types';

type Csrf = { token: string; headerName: string };
let csrf: Promise<Csrf> | null = null;
async function csrfToken() {
  if (!csrf)
    csrf = fetch('/api/admin/auth/csrf', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new ApiError(response.status, '관리자 서버에 연결할 수 없어요.');
        return response.json() as Promise<Csrf>;
      })
      .catch((error) => {
        csrf = null;
        throw error;
      });
  return csrf;
}
export async function adminRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (!['GET', 'HEAD'].includes(method)) {
    const token = await csrfToken();
    headers[token.headerName] = token.token;
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let response: Response;
  try {
    response = await fetch('/api/admin' + path, {
      method,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, '관리자 서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
  }
  const data = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    if (retry && response.status === 403 && data?.message?.includes('CSRF')) {
      csrf = null;
      return adminRequest(path, method, body, false);
    }
    throw new ApiError(
      response.status,
      data?.errors?.[0]?.message || data?.message || '관리자 요청을 처리하지 못했어요.',
    );
  }
  return data as T;
}
export const adminApi = {
  me: () => adminRequest<{ authenticated: boolean; username: string }>('/auth/me'),
  login: async (id: string, password: string) => {
    try {
      return await adminRequest<{ authenticated: boolean; username: string }>(
        '/auth/login',
        'POST',
        { id, password },
      );
    } finally {
      csrf = null;
    }
  },
  logout: async () => {
    try {
      await adminRequest('/auth/logout', 'POST');
    } finally {
      csrf = null;
    }
  },
  members: () => adminRequest<Member[]>('/accounts'),
  reports: () => adminRequest<Report[]>('/reports'),
  questions: () => adminRequest<{ questions: Question[]; sections: Category[] }>('/questions'),
  reviewProfile: (member: Member, status: ReviewStatus, reason: string) =>
    adminRequest('/photos/' + member.id, 'PUT', { status, reason, photos: member.reviewPhotos }),
  reviewReport: (report: Report, status: 'VALID' | 'DISMISSED', note: string) =>
    adminRequest('/reports/' + report.id, 'PUT', { status, note }),
  suspend: (member: Member, reason: string) =>
    adminRequest('/accounts/' + member.id, 'PUT', { suspended: !member.suspended, reason }),
  activateQuestion: (question: Question) =>
    adminRequest('/questions/' + question.id, 'PUT', { active: !question.active }),
  addQuestion: (draft: QuestionDraft) => adminRequest('/questions', 'POST', draft),
};

export function adminDate(value: string, withTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}.${parts.month}.${parts.day}${withTime ? ` ${parts.hour}:${parts.minute}` : ''}`;
}
