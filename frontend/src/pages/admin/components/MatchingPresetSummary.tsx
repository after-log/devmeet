import type { MatchingPreset } from '../types';

import { matchingWeights } from '../matchingPresets';

export default function WeightBar({ preset }: { preset: MatchingPreset }) {
  if (preset.legacyScoring)
    return (
      <p className="text-sm text-neutral-500">만남 20점 + 연락 20점 + 가치관 일치 문항당 1점</p>
    );
  return (
    <div>
      <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-neutral-100" aria-hidden="true">
        {matchingWeights.map(({ key, color }) => (
          <div key={key} className={color} style={{ width: `${preset[key]}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
        {matchingWeights.map(({ key, label, color }) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <i className={`size-2 rounded-sm ${color}`} aria-hidden="true" />
            {label} {preset[key]}%
          </span>
        ))}
      </div>
    </div>
  );
}
