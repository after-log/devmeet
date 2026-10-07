import type { SignupProfile } from '../types';
import { emptyProfile } from '../types';
export const onboarded = () => {
  try {
    return localStorage.getItem('devmeet.onboarded') === '1';
  } catch {
    return false;
  }
};
export const savedProfile = (): SignupProfile => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem('devmeet.profile') ?? 'null');
    if (parsed && typeof parsed === 'object') {
      const p = parsed as Record<string, unknown>;
      if (
        (p.role === '' || p.role === 'dev' || p.role === 'other') &&
        typeof p.nick === 'string' &&
        ['', 'ing', 'ok'].includes(String(p.email)) &&
        ['', 'ing', 'ok'].includes(String(p.github)) &&
        ['', 'all', 'dev', 'other'].includes(String(p.pref)) &&
        typeof p.rel === 'string' &&
        typeof p.time === 'string' &&
        Array.isArray(p.ans) &&
        p.ans.length <= 8 &&
        p.ans.every((a) => a === null || typeof a === 'boolean')
      ) {
        return {
          ...p,
          email: p.email === 'ing' ? '' : p.email,
          github: p.github === 'ing' ? '' : p.github,
        } as SignupProfile;
      }
    }
  } catch {
    /* 저장 공간을 사용할 수 없어도 목업은 동작합니다. */
  }
  return emptyProfile();
};
