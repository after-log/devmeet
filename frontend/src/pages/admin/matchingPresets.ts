import { matchingPresetSchema } from '@/validation/matching';
import type { MatchingPreset, MatchingPresetDraft } from './types';

export const matchingWeights = [
  {
    key: 'valuesWeight',
    label: '가치관',
    detail: '활성 매칭 문항 전체 중 같은 답변의 비율',
    color: 'bg-indigo-500',
  },
  {
    key: 'meetingWeight',
    label: '만남 방식',
    detail: '선호하는 만남 방식이 같으면 반영',
    color: 'bg-emerald-500',
  },
  {
    key: 'contactWeight',
    label: '연락 방식',
    detail: '선호하는 연락 방식이 같으면 반영',
    color: 'bg-sky-500',
  },
] as const;

export function createMatchingPresetDraft(
  preset?: MatchingPreset,
  asVersion = false,
): MatchingPresetDraft {
  return preset
    ? {
        baseId: asVersion ? preset.id : null,
        name: asVersion ? preset.name : `${preset.name.slice(0, 57)} 복사`,
        description: preset.legacyScoring ? '' : preset.description,
        valuesWeight: preset.legacyScoring ? 40 : preset.valuesWeight,
        meetingWeight: preset.legacyScoring ? 30 : preset.meetingWeight,
        contactWeight: preset.legacyScoring ? 30 : preset.contactWeight,
      }
    : {
        baseId: null,
        name: '',
        description: '',
        valuesWeight: 40,
        meetingWeight: 30,
        contactWeight: 30,
      };
}
export function matchingWeightTotal(draft: MatchingPresetDraft) {
  return draft.valuesWeight + draft.meetingWeight + draft.contactWeight;
}
export function isMatchingPresetDraftValid(draft: MatchingPresetDraft) {
  return matchingPresetSchema.safeParse(draft).success;
}
