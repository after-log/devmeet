import type { SelectOption } from '@/components/ui/select';
import {
  CONTACT,
  DRINKING,
  EDUCATION,
  MEETING,
  PREFERENCE,
  RELIGION,
  SMOKING,
} from '@/data/options';
import type { EditableProfileField, Profile } from '@/types';

export type ProfileFieldConfig = { label: string } & (
  | { kind: 'text'; maxLength: number }
  | { kind: 'number'; min: number; max: number }
  | { kind: 'select'; options: SelectOption[] }
  | { kind: 'location' }
  | { kind: 'photos' }
  | { kind: 'intro' }
  | { kind: 'tags' }
);

export const profileEditFields: Record<EditableProfileField, ProfileFieldConfig> = {
  photos: { label: '프로필 사진', kind: 'photos' },
  name: { label: '프로필 이름', kind: 'text', maxLength: 30 },
  age: { label: '나이', kind: 'number', min: 19, max: 80 },
  height: { label: '키', kind: 'number', min: 100, max: 250 },
  location: { label: '사는 지역', kind: 'location' },
  job: { label: '하는 일', kind: 'text', maxLength: 60 },
  education: { label: '최종 학력', kind: 'select', options: EDUCATION },
  role: {
    label: '직군',
    kind: 'select',
    options: [
      { value: 'developer', label: '개발자' },
      { value: 'non-developer', label: '비개발자' },
    ],
  },
  intro: { label: '자기소개', kind: 'intro' },
  tags: { label: '나를 표현하는 태그', kind: 'tags' },
  meeting: { label: '만남 빈도', kind: 'select', options: MEETING },
  contact: { label: '연락 빈도', kind: 'select', options: CONTACT },
  preference: { label: '만나고 싶은 사람', kind: 'select', options: PREFERENCE },
  smoking: { label: '흡연', kind: 'select', options: SMOKING },
  drinking: { label: '음주', kind: 'select', options: DRINKING },
  religion: { label: '종교', kind: 'select', options: RELIGION },
};

export const isEditableProfileField = (field: string): field is EditableProfileField =>
  Object.hasOwn(profileEditFields, field);

export const profilePhotos = (profile: Profile) =>
  profile.photos?.length ? profile.photos : profile.photo ? [profile.photo] : [];
