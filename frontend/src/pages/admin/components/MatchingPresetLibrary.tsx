import type { RefObject } from 'react';
import { Check } from 'lucide-react';
import { adminDate } from '../api';
import type { MatchingPreset } from '../types';
import { Panel } from './AdminUI';
import WeightBar from './MatchingPresetSummary';

export default function MatchingPresetLibrary({
  presets,
  activeId,
  heading,
}: {
  presets: MatchingPreset[];
  activeId: string;
  heading: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <section aria-labelledby="preset-library-title" className="mb-8">
      <h2
        ref={heading}
        tabIndex={-1}
        id="preset-library-title"
        className="mb-4! text-base font-semibold"
      >
        프리셋 보관함{' '}
        <span className="ml-1 text-sm font-normal text-neutral-500">{presets.length}</span>
      </h2>
      <div className="grid grid-cols-2 gap-4 max-[1000px]:grid-cols-1">
        {presets.map((preset) => (
          <Panel
            key={preset.id}
            className={
              preset.id === activeId
                ? 'border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-100'
                : undefined
            }
          >
            <div className="p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{preset.name}</h3>
                <span className="text-xs text-neutral-500">v{preset.version}</span>
                {preset.id === activeId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white">
                    <Check size={12} /> 적용 중
                  </span>
                )}
              </div>
              <p className="mb-4! text-sm text-neutral-600">
                {preset.description || '등록된 설명이 없습니다.'}
              </p>
              <WeightBar preset={preset} />
              <p className="mt-4! border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                {adminDate(preset.createdAt)} 저장
              </p>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}
