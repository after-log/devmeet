import { useState } from 'react';

export default function PhotoGallery({
  photos,
  photo,
  name,
}: {
  photos?: string[];
  photo: string;
  name: string;
}) {
  const items = photos?.length ? photos : photo ? [photo] : [];
  const [selected, setSelected] = useState('');
  const current = items.includes(selected) ? selected : items[0];
  if (!current) return null;
  return (
    <section aria-label={`${name} 프로필 사진`}>
      <img
        className="detail-photo"
        src={current}
        alt={`${name} 프로필 사진 ${items.indexOf(current) + 1}`}
      />
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3" aria-label="사진 선택">
          {items.map((src, index) => (
            <button
              key={src}
              type="button"
              className={`h-20 w-16 shrink-0 overflow-hidden rounded-md border-2 ${src === current ? 'border-blue' : 'border-transparent'}`}
              aria-label={`프로필 사진 ${index + 1} 보기`}
              aria-pressed={src === current}
              onClick={() => setSelected(src)}
            >
              <img className="h-full w-full object-cover" src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
