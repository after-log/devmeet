import axiosLibrary, { type InternalAxiosRequestConfig } from 'axios';
import { validateRequestBody } from '@/validation/requests';
import { ApiError } from './api-error';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Internal flags retained when retrying a CSRF-rejected request. */
    csrfRetried?: boolean;
    formValidated?: boolean;
    csrfVersion?: number;
    csrfHeaderName?: string;
  }
}

type Scope = 'member' | 'admin';
type Csrf = { token: string; headerName: string; version: number };
const csrf: Record<Scope, { version: number; promise: Promise<Csrf> | null }> = {
  member: { version: 0, promise: null },
  admin: { version: 0, promise: null },
};

export const axios = axiosLibrary.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { Accept: 'application/json', 'Cache-Control': 'no-cache, no-store' },
});

function pathOf(config: InternalAxiosRequestConfig) {
  return (config.url ?? '').split('?')[0];
}
function scopeOf(path: string): Scope {
  return path === '/admin' || path.startsWith('/admin/') ? 'admin' : 'member';
}
function isAuthenticationChange(config: InternalAxiosRequestConfig) {
  return (
    config.method?.toUpperCase() === 'POST' &&
    ['/login', '/register', '/logout', '/admin/auth/login', '/admin/auth/logout'].includes(
      pathOf(config),
    )
  );
}
function invalidateCsrf(scope: Scope) {
  csrf[scope].version++;
  csrf[scope].promise = null;
}
function getCsrf(scope: Scope): Promise<Csrf> {
  const state = csrf[scope];
  if (!state.promise) {
    const version = state.version;
    state.promise = axios
      .get<Omit<Csrf, 'version'>>(scope === 'admin' ? '/admin/auth/csrf' : '/csrf')
      .then(({ data }) => {
        if (
          typeof data?.token !== 'string' ||
          !data.token ||
          typeof data.headerName !== 'string' ||
          !data.headerName
        )
          throw new ApiError(0, '인증 정보를 불러오지 못했어요. 다시 시도해 주세요.');
        return { ...data, version };
      })
      .catch((error: unknown) => {
        if (state.version === version) state.promise = null;
        if (axiosLibrary.isCancel(error)) throw error;
        throw new ApiError(
          error instanceof ApiError ? error.status : 0,
          scope === 'admin' ? '관리자 서버에 연결할 수 없어요.' : '서버에 연결할 수 없어요.',
        );
      });
  }
  return state.promise;
}
function errorPayload(data: unknown): { message?: string; first?: string } {
  if (!data || typeof data !== 'object') return {};
  const body = data as { message?: unknown; errors?: { message?: unknown }[] };
  return {
    message: typeof body.message === 'string' ? body.message : undefined,
    first:
      Array.isArray(body.errors) && typeof body.errors[0]?.message === 'string'
        ? body.errors[0].message
        : undefined,
  };
}

axios.interceptors.request.use(async (config) => {
  const path = pathOf(config);
  const method = (config.method ?? 'GET').toUpperCase();
  // Retried configs already contain Axios-serialized JSON, so validate only the original input.
  if (!config.formValidated) {
    config.data = validateRequestBody(path, method, config.data);
    config.formValidated = true;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  } else if (config.data !== undefined) {
    config.headers.setContentType('application/json');
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await getCsrf(scopeOf(path));
    if (config.csrfHeaderName) config.headers.delete(config.csrfHeaderName);
    config.headers.set(token.headerName, token.token);
    config.csrfHeaderName = token.headerName;
    config.csrfVersion = token.version;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    if (isAuthenticationChange(response.config)) invalidateCsrf(scopeOf(pathOf(response.config)));
    if (response.status === 204) response.data = undefined;
    return response;
  },
  async (error: unknown) => {
    // Keep schema errors and cancellations intact for form handlers and callers.
    if (!axiosLibrary.isAxiosError(error) || axiosLibrary.isCancel(error)) throw error;
    const config = error.config;
    const scope = config ? scopeOf(pathOf(config)) : 'member';
    const status = error.response?.status ?? 0;
    const payload = errorPayload(error.response?.data);
    const changing =
      config && !['GET', 'HEAD', 'OPTIONS'].includes((config.method ?? 'GET').toUpperCase());
    if (changing && status === 403 && payload.message?.includes('CSRF') && !config.csrfRetried) {
      config.csrfRetried = true;
      // Parallel failures for the same stale token share one refresh instead of invalidating each other.
      if (config.csrfVersion === csrf[scope].version) invalidateCsrf(scope);
      return axios.request(config);
    }
    if (config && isAuthenticationChange(config)) invalidateCsrf(scope);
    throw new ApiError(
      status,
      payload.first ||
        payload.message ||
        (status === 0
          ? scope === 'admin'
            ? '관리자 서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'
            : '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'
          : scope === 'admin'
            ? '관리자 요청을 처리하지 못했어요.'
            : '요청을 처리하지 못했어요.'),
    );
  },
);

export default axios;
