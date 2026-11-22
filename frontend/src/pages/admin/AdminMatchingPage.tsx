import { Plus } from 'lucide-react';
import { AdminButton } from './components/AdminUI';
import ActiveMatchingPreset from './components/ActiveMatchingPreset';
import MatchingPresetLibrary from './components/MatchingPresetLibrary';
import MatchingPresetPerformance from './components/MatchingPresetPerformance';
import MatchingSettingsFeedback from './components/MatchingSettingsFeedback';
import MatchingSettingsGuide from './components/MatchingSettingsGuide';
import MatchingPresetDialogs from './dialogs/MatchingPresetDialogs';
import useMatchingSettings from './hooks/useMatchingSettings';
import useMatchingPresetDialogs from './hooks/useMatchingPresetDialogs';

export default function AdminMatchingPage() {
  const settings = useMatchingSettings();
  const dialogs = useMatchingPresetDialogs(settings);
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">매칭 설정</h1>
          <p className="mt-1! text-sm text-neutral-600">
            추천 우선순위를 프리셋으로 관리하고 연결 성과를 비교하세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton
            disabled={dialogs.busy || settings.loading || !settings.data}
            onClick={(event) => dialogs.openPicker(event.currentTarget)}
          >
            프리셋 선택
          </AdminButton>
          <AdminButton
            disabled={dialogs.busy || !settings.data}
            onClick={(event) => dialogs.startDraft(undefined, false, event.currentTarget)}
          >
            <Plus size={16} /> 새 프리셋
          </AdminButton>
        </div>
      </div>
      {settings.activePreset && (
        <ActiveMatchingPreset
          preset={settings.activePreset}
          busy={dialogs.busy}
          loading={settings.loading}
          onClone={(trigger) => dialogs.startDraft(settings.activePreset, false, trigger)}
          onSelect={dialogs.openPicker}
        />
      )}
      <MatchingSettingsGuide />
      <MatchingSettingsFeedback
        error={settings.error}
        notice={settings.notice}
        loading={settings.loading}
        busy={dialogs.busy}
        refresh={settings.refresh}
      />
      <MatchingPresetLibrary
        presets={settings.visiblePresets}
        activeId={settings.data?.activeId ?? ''}
        heading={dialogs.libraryTitle}
      />
      <MatchingPresetPerformance data={settings.data} />
      <MatchingPresetDialogs settings={settings} state={dialogs} />
    </>
  );
}
