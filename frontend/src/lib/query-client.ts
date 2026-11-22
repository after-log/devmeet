import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { queryKeys, getAuthQueryScope, type AuthQueryScope } from './query-keys';
import { ApiError } from './api-error';

function handleAuthError(error: Error, key?: readonly unknown[]) {
  const scope = getAuthQueryScope(key);
  if (error instanceof ApiError && error.status === 401 && scope) {
    void clearQueryScope(scope).then(() => {
      queryClient.setQueryData(
        queryKeys[scope].session.queryKey,
        scope === 'member' ? { user: null } : { authenticated: false, username: '' },
      );
    });
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (error, query) => handleAuthError(error, query.queryKey) }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) =>
      handleAuthError(error, mutation.options.mutationKey),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status < 500),
    },
    mutations: { retry: false },
  },
});

/** Cancel before removing so an old session's response cannot repopulate its cache. */
export async function clearQueryScope(scope: AuthQueryScope) {
  await queryClient.cancelQueries({ queryKey: queryKeys[scope]._def });
  queryClient.removeQueries({ queryKey: queryKeys[scope]._def });
}
