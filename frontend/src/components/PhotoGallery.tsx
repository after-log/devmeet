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
        <div className="flex items-center justify-center gap-1 py-2" aria-label="사진 선택">
          {items.map((src, index) => (
            <button
              key={src}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-point"
              aria-label={`프로필 사진 ${index + 1} 보기`}
              aria-pressed={src === current}
              onClick={() => setSelected(src)}
            >
              <span
                className={`h-2 w-2 rounded-full ${src === current ? 'bg-point' : 'bg-line-strong'}`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
