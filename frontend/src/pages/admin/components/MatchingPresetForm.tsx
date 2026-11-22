import type { Dispatch, SetStateAction } from 'react';
import type { MatchingPresetDraft } from '../types';
import {
  isMatchingPresetDraftValid,
  matchingWeightTotal,
  matchingWeights,
} from '../matchingPresets';
import { AdminButton } from './AdminUI';
import MatchingWeightField from './MatchingWeightField';

export default function MatchingPresetForm({
  draft,
  setDraft,
  busy,
  ready,
  error,
  backLabel,
  onCancel,
  onSave,
}: {
  draft: MatchingPresetDraft;
  setDraft: Dispatch<SetStateAction<MatchingPresetDraft>>;
  busy: boolean;
  ready: boolean;
  error: string;
  backLabel: string;
  onCancel: () => void;
  onSave: () => Promise<void>;
}) {
  const total = matchingWeightTotal(draft);
  const valid = isMatchingPresetDraftValid(draft);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
      className="p-5"
    >
      {error && (
        <p
          role="alert"
          className="mb-4! rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      <fieldset disabled={busy || !ready} className="m-0 min-w-0 border-0 p-0">
        <label className="mb-4 block text-sm font-medium">
          프리셋 이름
          <input
            required
            maxLength={60}
            disabled={!!draft.baseId}
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="예: 가치관 중심"
            className="mt-2 block w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800 disabled:bg-neutral-100"
          />
        </label>
        <label className="mb-5 block text-sm font-medium">
          설명
          <textarea
            maxLength={300}
            rows={2}
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            placeholder="어떤 연결을 우선하는 설정인지 적어 주세요."
            className="mt-2 block w-full resize-y rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800"
          />
        </label>
        <div className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-semibold">항목별 가중치</h3>
          <span
            className={`text-sm font-medium ${total === 100 ? 'text-emerald-700' : 'text-red-700'}`}
            aria-live="polite"
          >
            합계 {total}% / 100%
          </span>
        </div>
        {matchingWeights.map(({ key, label, detail }) => (
          <MatchingWeightField
            key={key}
            label={label}
            detail={detail}
            value={draft[key]}
            onChange={(value) => setDraft({ ...draft, [key]: value })}
          />
        ))}
        {total !== 100 && (
          <p className="mb-3! text-sm text-red-700">가중치 합계를 100%로 맞춰 주세요.</p>
        )}
        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
          <AdminButton disabled={busy} onClick={onCancel}>
            {backLabel}
          </AdminButton>
          <AdminButton type="submit" variant="primary" disabled={busy || !valid || !ready}>
            {busy ? '처리 중…' : draft.baseId ? '새 버전 저장' : '프리셋 저장'}
          </AdminButton>
        </div>
      </fieldset>
    </form>
  );
}
