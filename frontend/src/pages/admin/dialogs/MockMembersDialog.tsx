import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { mutationKeys, queryKeys } from '@/lib/query-keys';
import { adminApi } from '../api';
import AdminFormDialog from '../components/AdminFormDialog';
import { AdminButton } from '../components/AdminUI';
import { useAdmin } from '../hooks/useAdmin';

type Operation = 'create' | 'enable' | 'disable' | 'delete';

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = useQuery({
    queryKey: queryKeys.admin.mockMembers.queryKey,
    queryFn: adminApi.mockMembers,
  });
  const action = useMutation({
    mutationKey: mutationKeys.admin.action.mutationKey,
    mutationFn: async (operation: Operation) => {
      if (operation === 'create') {
        const result = await adminApi.createMockMembers(password);
        return `등록 ${result.created}명 · 기존 ${result.skipped}명 · 실패 ${result.failed}명`;
      }
      if (operation === 'delete') {
        const { deleted } = await adminApi.deleteMockMembers();
        return `테스트 계정 ${deleted}명을 삭제했어요. 자동 등록도 꺼졌어요.`;
      }
      await adminApi.setMockMembersEnabled(operation === 'enable');
      return operation === 'enable'
        ? '테스트 계정을 활성화했어요.'
        : '테스트 계정을 비활성화했어요.';
    },
    onSuccess: async () => {
      setPassword('');
      setConfirmDelete(false);
      await refresh();
    },
  });
  const busy = action.isPending;
  const state = status.data;
  const error = action.error ?? status.error;
  return (
    <AdminFormDialog
      title="테스트 계정 관리"
      description="가상 회원 30명과 프로필 사진을 등록하고 테스트 계정의 사용 여부를 관리해요."
      busy={busy}
      heading={heading}
      close={close}
      restoreFocus={restoreFocus}
    >
      <div className="space-y-4 p-6">
        {status.isPending && (
          <p role="status" className="text-sm">
            상태를 불러오는 중…
          </p>
        )}
        {state && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-neutral-700">
                등록 {state.count}명 · {state.enabled ? '활성' : '비활성'}
              </p>
              <AdminButton
                disabled={busy || confirmDelete}
                onClick={() => action.mutate(state.enabled ? 'disable' : 'enable')}
              >
                {state.enabled ? '비활성화' : '활성화'}
              </AdminButton>
            </div>
            {!state.enabled && (
              <p className="text-xs text-neutral-600">
                비활성 상태에서는 자동 등록, 테스트 계정 로그인과 추천을 사용할 수 없어요.
              </p>
            )}
            {state.enabled && !confirmDelete && (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!busy) action.mutate('create');
                }}
              >
                <label className="block text-sm font-medium">
                  초기 비밀번호 (선택)
                  <input
                    className="mt-2 block min-h-11 w-full rounded-lg border border-neutral-200 px-3"
                    type="password"
                    autoComplete="new-password"
                    minLength={10}
                    maxLength={72}
                    value={password}
                    disabled={busy}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                <p className="text-xs text-neutral-600">
                  비밀번호는 새로 등록하는 회원에게만 적용돼요.
                </p>
                <AdminButton type="submit" variant="primary" disabled={busy}>
                  {busy && action.variables === 'create' ? '등록 중…' : '등록하기'}
                </AdminButton>
              </form>
            )}
            {confirmDelete ? (
              <div className="space-y-3 rounded-lg border border-red-200 p-4">
                <p className="text-sm text-red-700">
                  테스트 계정 {state.count}명과 연결된 매칭, 대화, 프로필 사진을 영구 삭제해요.
                </p>
                <div className="flex flex-wrap gap-2">
                  <AdminButton disabled={busy} onClick={() => setConfirmDelete(false)}>
                    취소
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    disabled={busy}
                    onClick={() => action.mutate('delete')}
                  >
                    {busy ? '삭제 중…' : '영구 삭제'}
                  </AdminButton>
                </div>
              </div>
            ) : (
              state.count > 0 && (
                <AdminButton
                  variant="danger"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                >
                  테스트 계정 삭제
                </AdminButton>
              )
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error.message}
          </p>
        )}
        {action.data && (
          <p role="status" className="text-sm text-neutral-700">
            {action.data}
          </p>
        )}
      </div>
    </AdminFormDialog>
  );
}
