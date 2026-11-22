import { queryKeys, mutationKeys } from '@/lib/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApp } from '@/stores/app';
import { parseForm } from '@/validation/forms';
import { profileSchema } from '@/validation/profile';
import { usePhotoUpload } from './usePhotoUpload';
import type { Profile } from '@/types';

export function useProfileMutations() {
  const client = useQueryClient();
  const owner = useApp((s) => s.user?.id);
  const saved = async ({ profile }: { profile: Profile }) => {
    const current = useApp.getState();
    if (current.demo || !current.user || current.user.id !== owner) return;
    const user = { ...current.user, profile };
    useApp.setState({ user });
    client.setQueryData(queryKeys.member.session.queryKey, { user });
    await client.invalidateQueries({ queryKey: queryKeys.member.account(owner).queryKey });
  };
  const profile = useMutation({
    mutationKey: mutationKeys.member.profile(owner).mutationKey,
    mutationFn: (input: Partial<Profile>) => api.saveProfile(parseForm(profileSchema, input)),
    onSuccess: saved,
  });
  const values = useMutation({
    mutationKey: mutationKeys.member.values(owner).mutationKey,
    mutationFn: api.saveValues,
    onSuccess: saved,
  });
  const photo = usePhotoUpload(owner);
  return {
    saveProfile: profile.mutateAsync,
    saveValues: values.mutateAsync,
    photo: photo.mutateAsync,
  };
}
