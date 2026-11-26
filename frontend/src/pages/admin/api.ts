import { request } from '@/lib/api';
import type {
  AdminStatistics,
  CompanyEmailDirectory,
  MatchingPreset,
  MatchingPresetDraft,
  MatchingSettings,
  Category,
  Member,
  Question,
  QuestionDraft,
  Report,
  ReviewStatus,
} from './types';

export function adminRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  retry = true,
): Promise<T> {
  return request<T>('/admin' + path, method, body, retry);
}
export const adminApi = {
  me: () => adminRequest<{ authenticated: boolean; username: string }>('/auth/me'),
  login: (id: string, password: string) =>
    adminRequest<{ authenticated: boolean; username: string }>('/auth/login', 'POST', {
      id,
      password,
    }),
  logout: () => adminRequest<void>('/auth/logout', 'POST'),
  companyEmails: () => adminRequest<CompanyEmailDirectory>('/company-email'),
  reviewCompanyEmail: (
    id: string,
    body: { status: 'APPROVED' | 'REJECTED'; scope: 'MEMBER' | 'DOMAIN'; note: string },
  ) => adminRequest<void>('/company-email/requests/' + id, 'PUT', body),
  registerCompanyDomain: (body: {
    company: string;
    domain: string;
    website: string;
    note: string;
  }) => adminRequest<void>('/company-email/domains', 'POST', body),
  activateCompanyDomain: (domain: string, active: boolean, note: string) =>
    adminRequest<void>('/company-email/domains/' + encodeURIComponent(domain), 'PUT', {
      active,
      note,
    }),
  matching: () => adminRequest<MatchingSettings>('/matching'),
  createMatchingPreset: (draft: MatchingPresetDraft) =>
    adminRequest<MatchingPreset>('/matching', 'POST', draft),
  deleteMatchingPreset: (id: string) => adminRequest<void>('/matching/' + id, 'DELETE'),
  activateMatchingPreset: (id: string) => adminRequest<void>('/matching/active', 'PUT', { id }),
  statistics: (days: 7 | 30) => adminRequest<AdminStatistics>('/statistics?days=' + days),
  members: () => adminRequest<Member[]>('/accounts'),
  mockMembers: () => adminRequest<{ enabled: boolean; count: number }>('/mock-members'),
  setMockMembersEnabled: (enabled: boolean) =>
    adminRequest<{ enabled: boolean; count: number }>('/mock-members/enabled', 'PUT', { enabled }),
  deleteMockMembers: () => adminRequest<{ deleted: number }>('/mock-members', 'DELETE'),
  createMockMembers: (password: string) =>
    adminRequest<{ created: number; skipped: number; failed: number }>('/mock-members', 'POST', {
      password,
    }),
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
