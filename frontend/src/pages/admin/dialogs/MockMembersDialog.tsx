import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { mutationKeys } from '@/lib/query-keys';
import { adminApi } from '../api';
import AdminFormDialog from '../components/AdminFormDialog';
import { AdminButton } from '../components/AdminUI';
import { useAdmin } from '../hooks/useAdmin';

export default function MockMembersDialog({
  close,
  restoreFocus,
}: {
  close: () => void;
  restoreFocus: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { refresh } = useAdmin();
  const [password, setPassword] = useState('');
  const create = useMutation({
    mutationKey: mutationKeys.admin.action.mutationKey,
    mutationFn: adminApi.createMockMembers,
    onSuccess: async () => {
      setPassword('');
      await refresh();
    },
  });
  const result = create.data;
  return (
    <AdminFormDialog
      title="테스트 계정 등록"
      description="가상 회원 30명과 프로필 사진을 등록해요. 이미 있는 계정은 건너뛰어요."
      busy={create.isPending}
      heading={heading}
      close={close}
      restoreFocus={restoreFocus}
    >
      <form
        className="space-y-4 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!create.isPending && !result) create.mutate(password);
        }}
      >
        {!result && (
          <label className="block text-sm font-medium">
            초기 비밀번호 (선택)
            <input
              className="mt-2 block min-h-11 w-full rounded-lg border border-neutral-200 px-3"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={72}
              placeholder="10자 이상, UTF-8 기준 72바이트 이하"
              value={password}
              disabled={create.isPending}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span className="mt-2 block text-xs font-normal text-neutral-600">
              비워두면 각 계정에 임의의 비밀번호를 부여해요.
            </span>
          </label>
        )}
        {create.error && (
          <p role="alert" className="text-sm text-red-700">
            {create.error.message}
          </p>
        )}
        {result && (
          <p role="status" className="text-sm text-neutral-700">
            등록 {result.created}명 · 기존 {result.skipped}명 · 실패 {result.failed}명
          </p>
        )}
        <div className="flex justify-end">
          {result ? (
            <AdminButton onClick={close}>닫기</AdminButton>
          ) : (
            <AdminButton type="submit" variant="primary" disabled={create.isPending}>
              {create.isPending ? '등록 중…' : '등록하기'}
            </AdminButton>
          )}
        </div>
      </form>
    </AdminFormDialog>
  );
}
