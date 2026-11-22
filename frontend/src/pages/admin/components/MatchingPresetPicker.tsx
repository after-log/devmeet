import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import { AdminButton } from './AdminUI';
import WeightBar from './MatchingPresetSummary';
import type { MatchingPreset } from '../types';

export default function MatchingPresetPicker({
  presets,
  activeId,
  selectedId,
  busy,
  loading,
  notice,
  error,
  retry,
  select,
  create,
  edit,
  remove,
  apply,
  close,
}: {
  presets: MatchingPreset[];
  activeId: string;
  selectedId: string;
  busy: boolean;
  loading: boolean;
  notice: string;
  error: string;
  retry: () => void;
  select: (id: string) => void;
  create: () => void;
  edit: (preset: MatchingPreset, asVersion: boolean) => void;
  remove: (preset: MatchingPreset, trigger: HTMLElement) => void;
  apply: (preset: MatchingPreset, trigger: HTMLElement) => void;
  close: () => void;
}) {
  const selected = presets.find((preset) => preset.id === selectedId);
  return (
    <>
      <div className="p-6 max-sm:p-5">
        {error && (
          <p
            role="alert"
            className="mb-4! rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
            <button
              type="button"
              disabled={busy || loading}
              onClick={retry}
              className="ml-2 underline"
            >
              다시 불러오기
            </button>
          </p>
        )}
        {loading && (
          <p role="status" className="mb-3! text-sm text-neutral-500">
            최신 프리셋을 확인하는 중…
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mb-4! rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {notice}
          </p>
        )}
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">사용 가능한 프리셋 {presets.length}개</p>
          <AdminButton disabled={busy} onClick={create}>
            <Plus size={15} /> 새 프리셋
          </AdminButton>
        </div>
        <fieldset disabled={busy} className="m-0 min-w-0 space-y-3 border-0 p-0">
          <legend className="sr-only">적용할 프리셋 선택</legend>
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={`rounded-xl border p-4 ${selectedId === preset.id ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-100' : 'border-neutral-200 bg-white'}`}
            >
              <label className="mb-3 flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="matching-preset"
                  value={preset.id}
                  checked={selectedId === preset.id}
                  onChange={() => select(preset.id)}
                  className="mt-1 size-4 min-h-0 w-4 shrink-0 border-0 p-0 accent-indigo-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{preset.name}</span>
                    <span className="text-xs text-neutral-500">v{preset.version}</span>
                    {activeId === preset.id && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
                        <Check size={12} /> 적용 중
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-neutral-600">
                    {preset.description || '등록된 설명이 없습니다.'}
                  </span>
                </span>
              </label>
              <WeightBar preset={preset} />
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
                <AdminButton
                  aria-label={`${preset.name} v${preset.version} 복제`}
                  disabled={busy}
                  onClick={() => edit(preset, false)}
                >
                  <Copy size={14} /> 복제
                </AdminButton>
                {!preset.legacyScoring && (
                  <AdminButton
                    aria-label={`${preset.name} v${preset.version}에서 새 버전 만들기`}
                    disabled={busy}
                    onClick={() => edit(preset, true)}
                  >
                    새 버전
                  </AdminButton>
                )}
                <AdminButton
                  variant="danger"
                  className="ml-auto"
                  aria-label={`${preset.name} v${preset.version} 삭제`}
                  title={
                    activeId === preset.id
                      ? '다른 프리셋을 적용한 뒤 삭제할 수 있습니다.'
                      : undefined
                  }
                  disabled={busy || loading || activeId === preset.id}
                  onClick={(event) => remove(preset, event.currentTarget)}
                >
                  <Trash2 size={14} /> 삭제
                </AdminButton>
              </div>
            </div>
          ))}
        </fieldset>
      </div>
      <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-600">
          {selected ? (
            <>
              {selected.name} <span className="text-neutral-400">v{selected.version}</span>
              {selected.id === activeId && (
                <span className="ml-2 text-xs text-indigo-700">현재 적용 중</span>
              )}
            </>
          ) : (
            '프리셋을 선택해 주세요.'
          )}
        </p>
        <div className="flex gap-2">
          <AdminButton disabled={busy} onClick={close}>
            닫기
          </AdminButton>
          <AdminButton
            variant="primary"
            disabled={busy || loading || !selected || selected.id === activeId}
            onClick={(event) => {
              if (selected) apply(selected, event.currentTarget);
            }}
          >
            선택한 프리셋 적용
          </AdminButton>
        </div>
      </footer>
    </>
  );
}
