import { Check, Copy, Sliders } from 'lucide-react';
import type { MatchingPreset } from '../types';
import { matchingWeights as weights } from '../matchingPresets';
import { AdminButton } from './AdminUI';

export default function ActiveMatchingPreset({
  preset,
  busy,
  loading,
  onClone,
  onSelect,
}: {
  preset: MatchingPreset;
  busy: boolean;
  loading: boolean;
  onClone: (trigger: HTMLElement) => void;
  onSelect: (trigger: HTMLElement) => void;
}) {
  return (
    <section
      aria-labelledby="active-preset-title"
      className="mb-6 overflow-hidden rounded-xl border border-indigo-300 bg-white shadow-[0_3px_12px_#4f46e50a]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50 px-5 py-3">
        <h2
          id="active-preset-title"
          className="flex items-center gap-2 text-sm font-semibold text-indigo-950"
        >
          <Sliders size={16} /> 현재 운영 프리셋
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
          <Check size={13} /> 적용 중
        </span>
      </div>
      <div className="grid grid-cols-[1fr_1.2fr] items-center gap-6 p-6 max-[1100px]:grid-cols-1 max-sm:p-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            <h3 className="text-2xl font-semibold tracking-tight text-neutral-900">
              {preset.name}
            </h3>
            <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-600">
              버전 {preset.version}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-neutral-600">
            {preset.description || '현재 추천 순위를 결정하는 프리셋입니다.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminButton disabled={busy} onClick={(event) => onClone(event.currentTarget)}>
              <Copy size={15} /> 이 설정 복제
            </AdminButton>
            <AdminButton
              disabled={busy || loading}
              onClick={(event) => onSelect(event.currentTarget)}
            >
              다른 프리셋 선택
            </AdminButton>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-2.5">
            {weights.map(({ key, label, color }) => (
              <div
                key={key}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 max-sm:px-2.5"
              >
                <p className="mb-2! flex items-center gap-1.5 text-xs text-neutral-600">
                  <span className={`size-2 shrink-0 rounded-sm ${color}`} aria-hidden="true" />
                  {label}
                </p>
                <p className="text-2xl font-semibold tracking-tight text-neutral-900 tabular-nums">
                  {preset[key]}
                  <span className="ml-1 text-sm font-normal text-neutral-500">
                    {preset.legacyScoring ? '점' : '%'}
                  </span>
                </p>
                {preset.legacyScoring && key === 'valuesWeight' && (
                  <p className="mt-1! text-xs text-neutral-500">일치 문항당</p>
                )}
              </div>
            ))}
          </div>
          {!preset.legacyScoring && (
            <div
              className="mt-3 flex h-2 overflow-hidden rounded-full bg-neutral-100"
              aria-hidden="true"
            >
              {weights.map(({ key, color }) => (
                <div key={key} className={color} style={{ width: `${preset[key]}%` }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-3 text-xs text-neutral-500">
        전체 회원의 새 추천에 사용 중 · 이미 배정된 오늘의 추천은 유지됩니다.
      </div>
    </section>
  );
}
