import { ChevronRight } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useApp } from '@/stores/app';
import type { EditableProfileField, Profile } from '@/types';
import { isEditableProfileField, profileEditFields, profilePhotos } from './fields';

const displayValue = (profile: Profile, field: EditableProfileField) => {
  switch (field) {
    case 'photos':
      return `${profilePhotos(profile).length}장`;
    case 'age':
      return `${profile.age}세`;
    case 'height':
      return `${profile.height}cm`;
    case 'role':
      return profile.role === 'developer' ? '개발자' : '비개발자';
    case 'preference':
      return profile.role === 'non-developer' ? '개발자' : profile.preference;
    case 'tags':
      return profile.tags.join(', ');
    default:
      return profile[field];
  }
};

export default function ProfileEditPage() {
  const { user, demo } = useApp();
  const profile = user?.profile;
  if (demo || !profile) return <Navigate to="/me" replace />;

  const [representativePhoto] = profilePhotos(profile);

  return (
    <ul>
      {Object.keys(profileEditFields)
        .filter(isEditableProfileField)
        .map((field) => (
          <li key={field}>
            <Link
              className="settings-row items-center rounded-sm focus-visible:outline-2 focus-visible:outline-point"
              to={`/me/edit/${field}`}
              state={{ fromProfileEdit: true }}
            >
              <div className="shrink-0 font-medium">{profileEditFields[field].label}</div>
              <span className="flex min-w-0 items-center gap-2 text-right">
                {field === 'photos' && representativePhoto && (
                  <img
                    className="size-9 shrink-0 rounded-md object-cover"
                    src={representativePhoto}
                    alt=""
                  />
                )}
                <span className="line-clamp-2 wrap-anywhere">
                  {displayValue(profile, field) || '미입력'}
                </span>
                <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
    </ul>
  );
}
