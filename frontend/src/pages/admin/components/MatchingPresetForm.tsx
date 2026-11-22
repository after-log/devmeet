import { Controller } from 'react-hook-form';
import { useSchemaForm } from '@/hooks/useSchemaForm';
import { matchingPresetSchema } from '@/validation/matching';
import { FormErrors } from '@/components/ui/form-errors';
import type { MatchingPresetDraft } from '../types';
import { matchingWeightTotal, matchingWeights } from '../matchingPresets';
import { AdminButton } from './AdminUI';
import MatchingWeightField from './MatchingWeightField';

export default function MatchingPresetForm({
  draft,
  busy,
  ready,
  error,
  backLabel,
  onCancel,
  onSave,
}: {
  draft: MatchingPresetDraft;
  busy: boolean;
  ready: boolean;
  error: string;
  backLabel: string;
  onCancel: () => void;
  onSave: (input: MatchingPresetDraft) => Promise<void>;
}) {
  const form = useSchemaForm(matchingPresetSchema, { values: draft });
  const total = matchingWeightTotal(form.watch());
  const submitting = busy || form.formState.isSubmitting;
  return (
    <form noValidate onSubmit={form.handleSubmit(onSave)} className="p-5">
      <FormErrors
        errors={form.formState.errors}
        serverError={error}
        className="mb-4! rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      />
      <fieldset disabled={submitting || !ready} className="m-0 min-w-0 border-0 p-0">
        <label className="mb-4 block text-sm font-medium">
          프리셋 이름
          <input
            maxLength={60}
            readOnly={!!draft.baseId}
            {...form.register('name')}
            placeholder="예: 가치관 중심"
            className="mt-2 block w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800 read-only:bg-neutral-100"
          />
        </label>
        <label className="mb-5 block text-sm font-medium">
          설명
          <textarea
            maxLength={300}
            rows={2}
            {...form.register('description')}
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
          <Controller
            key={key}
            name={key}
            control={form.control}
            render={({ field }) => (
              <MatchingWeightField
                label={label}
                detail={detail}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
              />
            )}
          />
        ))}
        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
          <AdminButton disabled={submitting} onClick={onCancel}>
            {backLabel}
          </AdminButton>
          <AdminButton type="submit" variant="primary" disabled={submitting || !ready}>
            {submitting ? '처리 중…' : draft.baseId ? '새 버전 저장' : '프리셋 저장'}
          </AdminButton>
        </div>
      </fieldset>
    </form>
  );
}
