import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPhoto({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src)
    return (
      <span
        role="img"
        aria-label={alt || '등록된 사진 없음'}
        className={cn(
          'inline-grid shrink-0 place-items-center bg-neutral-100 text-neutral-500',
          className,
        )}
      >
        <ImageOff size={20} />
      </span>
    );
  return <img src={src} alt={alt} className={className} onError={() => setFailed(src)} />;
}
