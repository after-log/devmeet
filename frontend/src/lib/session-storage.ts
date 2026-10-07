import { profiles } from '../data/profiles';

type Session = { likes: string[]; matched: boolean; messages: string[] };
export const savedSession = (): Session => {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem('devmeet.session') ?? 'null');
    if (data && typeof data === 'object') {
      const s = data as Record<string, unknown>;
      if (
        Array.isArray(s.likes) &&
        s.likes.every((id) => profiles.some((p) => p.initial === id)) &&
        typeof s.matched === 'boolean' &&
        Array.isArray(s.messages) &&
        s.messages.every((m) => typeof m === 'string' && m.length <= 1000)
      ) {
        return {
          likes: s.likes,
          matched: s.matched && s.likes.includes('MJ'),
          messages: s.messages,
        };
      }
    }
  } catch {
    /* 저장 공간이 없어도 메모리 상태로 동작합니다. */
  }
  return { likes: [], matched: false, messages: [] };
};
export const saveSession = (session: Session) => {
  try {
    sessionStorage.setItem('devmeet.session', JSON.stringify(session));
  } catch {
    /* 메모리 상태 유지 */
  }
};
