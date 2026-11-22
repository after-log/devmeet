import { mutationKeys } from '@/lib/query-keys';
import { useMutation } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { recoveryFormSchema } from '@/validation/auth';
import type { z } from 'zod';

export function useRecovery() {
  return useMutation({
    mutationKey: mutationKeys.public.recovery.mutationKey,
    mutationFn: async (input: z.output<typeof recoveryFormSchema>) => {
      if (input.mode === 'verify') {
        await request('/auth/email/verify', 'POST', { token: input.token });
        return '이메일 확인이 완료됐어요.';
      }
      if (input.mode === 'reset') {
        await request('/auth/password/reset', 'POST', {
          token: input.token,
          password: input.password,
        });
        return '비밀번호를 바꿨어요. 다시 로그인해 주세요.';
      }
      return (
        await request<{ message: string }>('/auth/password/request', 'POST', { email: input.email })
      ).message;
    },
  });
}
