import { mutationKeys } from '@/lib/query-keys';
import { useMutation } from '@tanstack/react-query';
import { useApp } from '@/stores/app';
import type { Person } from '@/types';

export function useMemberActions() {
  const like = useMutation({
    mutationKey: mutationKeys.member.like.mutationKey,
    mutationFn: (person: Person) => useApp.getState().like(person),
  });
  const logout = useMutation({
    mutationKey: mutationKeys.member.logout.mutationKey,
    mutationFn: () => useApp.getState().logout(),
  });
  return { like: like.mutateAsync, logout: logout.mutateAsync };
}
