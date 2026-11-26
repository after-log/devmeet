import {
  createQueryKeys,
  createMutationKeys,
  mergeQueryKeys,
} from '@lukemorales/query-key-factory';

const memberQueries = createQueryKeys('member', {
  session: null,
  account: (owner: string | undefined) => ({
    queryKey: [owner],
    contextQueries: {
      snapshot: null,
      blocks: null,
      workEmail: null,
      messages: (peer: string) => ({
        queryKey: [peer],
        contextQueries: {
          page: (before?: string) => [before],
        },
      }),
    },
  }),
});

const adminQueries = createQueryKeys('admin', {
  session: null,
  account: (username: string) => ({
    queryKey: [username],
    contextQueries: {
      directory: null,
      companyEmails: null,
      matching: null,
      statistics: (days: 7 | 30) => [days],
    },
  }),
  legacy: (page: number) => [page],
});

const publicQueries = createQueryKeys('public', {
  authCapabilities: null,
  providers: null,
  valueCatalog: null,
});

export const queryKeys = mergeQueryKeys(memberQueries, adminQueries, publicQueries);

const memberMutations = createMutationKeys('member', {
  like: null,
  logout: null,
  profile: (owner: string | undefined) => [owner],
  values: (owner: string | undefined) => [owner],
  photo: (owner: string | undefined) => [owner],
  block: null,
  report: null,
  socialLink: null,
  workEmailRequest: null,
  workEmailVerify: null,
  companyReview: null,
  sendMessage: (peer: string) => [peer],
  loadOlderMessages: (peer: string) => [peer],
});

const adminMutations = createMutationKeys('admin', {
  action: null,
  companyEmailReview: null,
  companyDomainRegister: null,
  companyDomainActivate: null,
  matchingCreate: null,
  matchingDelete: null,
  matchingActivate: null,
  legacyUpdate: null,
});

const publicMutations = createMutationKeys('public', {
  recovery: null,
});

export const mutationKeys = mergeQueryKeys(memberMutations, adminMutations, publicMutations);
export type AuthQueryScope = 'member' | 'admin';

export function getAuthQueryScope(key?: readonly unknown[]): AuthQueryScope | undefined {
  if (key?.[0] === queryKeys.member._def[0]) return 'member';
  if (key?.[0] === queryKeys.admin._def[0]) return 'admin';
}

export function isSessionQueryKey(key: readonly unknown[]) {
  const scope = getAuthQueryScope(key);
  return (
    !!scope &&
    key.length === queryKeys[scope].session.queryKey.length &&
    key.every((part, index) => part === queryKeys[scope].session.queryKey[index])
  );
}
