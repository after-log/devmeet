import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ProfilePhotoFields from '@/components/ProfilePhotoFields';
import { Select } from '@/components/ui/select';
import { REGIONS, splitLocation } from '@/data/options';
import { useProfileMutations } from '@/hooks/queries/useProfileMutations';
import { useApp } from '@/stores/app';
import type { EditableProfileField, Profile } from '@/types';
import { formErrorMessage } from '@/validation/forms';
import { isEditableProfileField, profileEditFields, profilePhotos } from './fields';

function ProfileFieldForm({
  field,
  profile,
  photoReviewReason,
}: {
  field: EditableProfileField;
  profile: Profile;
  photoReviewReason?: string;
}) {
  const config = profileEditFields[field];
  const { updateProfileField, photo } = useProfileMutations();
  const navigate = useNavigate();
  const { state } = useLocation();
  const fixedPreference = field === 'preference' && profile.role === 'non-developer';
  const [value, setValue] = useState(() => {
    if (field === 'tags') return profile.tags.join(', ');
    if (fixedPreference) return '개발자';
    return String(profile[field] ?? '');
  });
  const [location, setLocation] = useState(() => splitLocation(profile.location));
  const [photos, setPhotos] = useState(() => profilePhotos(profile));
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploading || saving) return;
    setError('');
    setSaving(true);
    try {
      let input: unknown = value;
      switch (config.kind) {
        case 'number':
          input = value === '' ? undefined : Number(value);
          break;
        case 'location':
          if (!location.city || !location.district)
            throw new Error('시·도와 시·군·구를 선택해 주세요.');
          input = `${location.city} ${location.district}`;
          break;
        case 'tags':
          input = value
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);
          break;
        case 'photos':
          input = photos;
          break;
      }
      await updateProfileField({ field, value: input });
      toast('프로필을 저장했어요.');
      if (state?.fromMe || state?.fromProfileEdit) navigate(-1);
      else navigate('/me/edit', { replace: true });
    } catch (error) {
      setError(formErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const input = () => {
    switch (config.kind) {
      case 'photos':
        return (
          <>
            <p className="mb-2 text-sm text-fg-3">{photos.length} / 6장</p>
            {photoReviewReason && (
              <p className="mb-3 text-sm wrap-anywhere text-fg-3">
                <strong className="text-fg">검수 사유</strong> · {photoReviewReason}
              </p>
            )}
            <ProfilePhotoFields
              photos={photos}
              saving={saving}
              uploading={uploading}
              onChange={setPhotos}
              uploadPhoto={photo}
              onUploadingChange={setUploading}
              onError={setError}
            />
          </>
        );
      case 'location':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="formlabel" htmlFor="edit-city">
                시·도
              </label>
              <Select
                id="edit-city"
                value={location.city}
                placeholder="시·도 선택"
                options={Object.keys(REGIONS)}
                onValueChange={(city) => setLocation({ city, district: '' })}
                disabled={saving}
              />
            </div>
            <div>
              <label className="formlabel" htmlFor="edit-district">
                시·군·구
              </label>
              <Select
                id="edit-district"
                value={location.district}
                placeholder="시·군·구 선택"
                options={REGIONS[location.city] ?? []}
                onValueChange={(district) => setLocation({ ...location, district })}
                disabled={saving || !location.city}
              />
            </div>
          </div>
        );
      case 'select': {
        const options = fixedPreference ? ['개발자'] : config.options;
        const hasValue = options.some(
          (option) => (typeof option === 'string' ? option : option.value) === value,
        );
        return (
          <>
            <Select
              id="edit-value"
              value={value}
              options={value && !hasValue ? [value, ...options] : options}
              onValueChange={setValue}
              disabled={saving || fixedPreference}
            />
            {fixedPreference && (
              <p className="mt-2 text-sm text-fg-3">비개발자는 개발자를 추천받아요.</p>
            )}
          </>
        );
      }
      case 'intro':
        return (
          <textarea
            id="edit-value"
            className="min-h-28 w-full rounded-md border border-line-strong bg-surface p-3 text-sm text-fg"
            maxLength={1000}
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            disabled={saving}
          />
        );
      case 'number':
        return (
          <input
            id="edit-value"
            type="number"
            inputMode="numeric"
            min={config.min}
            max={config.max}
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            disabled={saving}
          />
        );
      case 'tags':
      case 'text':
        return (
          <>
            <input
              id="edit-value"
              type="text"
              maxLength={config.kind === 'tags' ? 120 : config.maxLength}
              value={value}
              onChange={(event) => setValue(event.currentTarget.value)}
              disabled={saving}
            />
            {config.kind === 'tags' && (
              <p className="mt-2 text-sm text-fg-3">
                쉼표로 구분해서 최대 5개까지 입력할 수 있어요.
              </p>
            )}
          </>
        );
    }
  };

  return (
    <form noValidate onSubmit={save}>
      {config.kind !== 'photos' && config.kind !== 'location' && (
        <label className="sr-only" htmlFor="edit-value">
          {config.label}
        </label>
      )}
      {input()}
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      {!fixedPreference && (
        <button className="btn full mt-5" type="submit" disabled={uploading || saving}>
          {saving ? '저장 중…' : '저장하기'}
        </button>
      )}
    </form>
  );
}

export default function ProfileFieldPage() {
  const { field } = useParams();
  const { user, demo } = useApp();
  if (demo || !user?.profile) return <Navigate to="/me" replace />;
  if (!field || !isEditableProfileField(field)) return <Navigate to="/me/edit" replace />;
  return (
    <ProfileFieldForm
      key={`${user.id}:${field}`}
      field={field}
      profile={user.profile}
      photoReviewReason={user.verification?.photoReviewReason}
    />
  );
}
