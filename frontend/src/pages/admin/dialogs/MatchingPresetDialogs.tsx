import type useMatchingSettings from '../hooks/useMatchingSettings';
import type useMatchingPresetDialogs from '../hooks/useMatchingPresetDialogs';
import AdminFormDialog from '../components/AdminFormDialog';
import MatchingPresetDialog from '../components/MatchingPresetDialog';
import MatchingPresetPicker from '../components/MatchingPresetPicker';
import MatchingPresetForm from '../components/MatchingPresetForm';

export default function MatchingPresetDialogs({
  settings,
  state,
}: {
  settings: ReturnType<typeof useMatchingSettings>;
  state: ReturnType<typeof useMatchingPresetDialogs>;
}) {
  return (
    <>
      {state.workspace && (
        <AdminFormDialog
          title={
            state.workspace === 'select'
              ? '프리셋 선택'
              : state.draft.baseId
                ? '새 버전 만들기'
                : '프리셋 만들기'
          }
          description={
            state.workspace === 'select'
              ? '추천에 적용할 프리셋을 선택하세요. 복제와 버전 관리도 여기서 할 수 있습니다.'
              : '가중치 합계를 100%로 맞춰 저장하세요. 저장 후 적용할 프리셋을 선택할 수 있습니다.'
          }
          busy={state.busy || !!state.pending}
          heading={state.workspaceTitle}
          close={state.closeWorkspace}
          restoreFocus={state.restoreWorkspaceFocus}
        >
          {state.workspace === 'edit' ? (
            <MatchingPresetForm
              draft={state.draft}
              busy={state.busy}
              ready={!!settings.data}
              error={state.workspaceError}
              backLabel={state.editorFromPicker ? '선택 화면으로' : '취소'}
              onCancel={state.cancelEditor}
              onSave={state.save}
            />
          ) : (
            <MatchingPresetPicker
              presets={settings.visiblePresets}
              activeId={settings.data?.activeId ?? ''}
              selectedId={state.selectedPresetId}
              busy={state.busy || !!state.pending}
              loading={settings.loading}
              notice={settings.notice}
              error={settings.error}
              retry={settings.refresh}
              select={state.setSelectedPresetId}
              create={() => state.startDraft()}
              edit={(preset, asVersion) => state.startDraft(preset, asVersion)}
              remove={(preset, trigger) => state.openConfirmation('delete', preset, trigger)}
              apply={(preset, trigger) => state.openConfirmation('apply', preset, trigger)}
              close={state.closeWorkspace}
            />
          )}
        </AdminFormDialog>
      )}
      {state.pending && (
        <MatchingPresetDialog
          action={state.pending.action}
          preset={state.pending.preset}
          busy={state.busy}
          error={state.dialogError}
          close={state.closeConfirmation}
          confirm={() => void state.confirm()}
          restoreFocus={state.restoreConfirmationFocus}
        />
      )}
    </>
  );
}
