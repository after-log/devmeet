import { useEffect, useRef, useState } from 'react';
import { drawMosaic, frame, play, useReducedMotion } from '@/lib/pixel';

/**
 * 추천 사진 모자이크 공개: 사진이 4→8→16→32칸 모자이크를 거쳐 선명해진다.
 * 실제 사진은 항상 <img>로 그려 두고, 위에 덮은 캔버스만 잠깐 보였다 사라진다.
 */
const PixelPhoto = ({ src, alt }: { src: string; alt: string }) => {
  const img = useRef<HTMLImageElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const [revealing, setRevealing] = useState(!reduce);

  useEffect(() => {
    if (reduce) return setRevealing(false);
    setRevealing(true);
    return play(async (signal) => {
      const el = img.current;
      const c = canvas.current;
      if (!el || !c) return;
      if (!el.complete) await new Promise((r) => el.addEventListener('load', r, { once: true }));
      if (!el.naturalWidth) return setRevealing(false);
      const rect = el.getBoundingClientRect();
      c.width = Math.max(1, Math.round(rect.width));
      c.height = Math.max(1, Math.round(rect.height));
      const ctx = c.getContext('2d')!;
      for (const n of [4, 8, 16, 32]) {
        drawMosaic(ctx, el, 0, 0, c.width, c.height, n);
        await frame(90, signal);
      }
      setRevealing(false);
    });
  }, [src, reduce]);

  return (
    <span className="pixel-photo">
      <img ref={img} src={src} alt={alt} />
      <canvas ref={canvas} aria-hidden="true" className={revealing ? '' : 'hidden'} />
    </span>
  );
};
export default PixelPhoto;
