import { useId } from 'react';
import { toast } from 'sonner';
import { formErrorMessage, parseForm } from '@/validation/forms';
import { photoUploadCountSchema } from '@/validation/profile';

export default function ProfilePhotoFields({
  photos,
  uploading,
  saving,
  onChange,
  uploadPhoto,
  onUploadingChange,
  onError,
}: {
  photos: string[];
  uploading: boolean;
  saving: boolean;
  onChange: (photos: string[]) => void;
  uploadPhoto: (file: File) => Promise<{ photo: string }>;
  onUploadingChange: (uploading: boolean) => void;
  onError: (message: string) => void;
}) {
  const inputId = useId();
  const busy = uploading || saving;

  const upload = async (files: File[]) => {
    if (!files.length) return;
    onError('');
    try {
      parseForm(photoUploadCountSchema, photos.length + files.length);
      onUploadingChange(true);
      const uploaded = [...photos];
      for (const file of files) {
        const { photo } = await uploadPhoto(file);
        uploaded.push(photo);
        onChange([...uploaded]);
      }
      toast('사진을 등록했어요. 저장하면 검수가 시작돼요.');
    } catch (error) {
      onError(formErrorMessage(error));
    } finally {
      onUploadingChange(false);
    }
  };

  return (
    <>
      <p className="mb-4 text-xs text-fg-3">
        얼굴이 잘 보이는 사진을 최소 3장 등록해 주세요. 첫 번째 사진이 대표 사진이에요.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={photo} className="min-w-0 space-y-2">
            <img
              className="aspect-3/4 w-full rounded-lg object-cover"
              src={photo}
              alt={index === 0 ? '대표 사진' : `등록 사진 ${index + 1}`}
            />
            <button
              type="button"
              className="w-full text-xs text-point"
              disabled={busy || index === 0}
              onClick={() => onChange([photo, ...photos.filter((item) => item !== photo)])}
            >
              {index === 0 ? '대표 사진' : '대표로 설정'}
            </button>
            <button
              type="button"
              className="w-full text-xs text-fg-3"
              disabled={busy}
              onClick={() => onChange(photos.filter((item) => item !== photo))}
              aria-label={`사진 ${index + 1} 삭제`}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
      <label className="formlabel" htmlFor={inputId}>
        {uploading ? '사진 업로드 중…' : '사진 추가하기'}
        <input
          className="mt-2"
          id={inputId}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={busy || photos.length >= 6}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = '';
            void upload(files);
          }}
        />
      </label>
      <p className="footnote text-left">
        사진 전체가 승인된 뒤 프로필에 공개돼요. 사진을 변경하면 다시 검수를 받아요.
      </p>
    </>
  );
}
