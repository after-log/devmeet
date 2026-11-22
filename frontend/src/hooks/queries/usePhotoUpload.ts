import { mutationKeys } from '@/lib/query-keys';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { parseForm } from '@/validation/forms';
import { photoFileSchema, photoDimensionsSchema } from '@/validation/profile';

export async function preparePhotoUpload(file: File) {
  parseForm(photoFileSchema, file);
  const image = await createImageBitmap(file);
  let canvas: HTMLCanvasElement;
  try {
    parseForm(photoDimensionsSchema, { width: image.width, height: image.height });
    canvas = document.createElement('canvas');
    const ratio = Math.min(1, 640 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('사진을 처리하지 못했어요.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } finally {
    image.close();
  }
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('사진을 처리하지 못했어요.'))),
      'image/jpeg',
      0.85,
    ),
  );
  const form = new FormData();
  form.append('file', blob, 'profile.jpg');
  return form;
}

export function usePhotoUpload(owner: string | undefined) {
  return useMutation({
    mutationKey: mutationKeys.member.photo(owner).mutationKey,
    mutationFn: async (file: File) => api.photo(await preparePhotoUpload(file)),
  });
}
