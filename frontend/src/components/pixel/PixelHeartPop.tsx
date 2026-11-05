import { useEffect, useRef } from 'react';
import { HEART, frame, palette, play, prefersReducedMotion, sprite } from '@/lib/pixel';

/**
 * 좋아요 버튼 위 픽셀 하트 팝. trigger 값이 바뀔 때마다 한 번 재생된다.
 * 하트가 2단계로 커졌다 줄고, 4색 픽셀 6조각이 튀고 사라진다.
 */
const PixelHeartPop = ({ trigger }: { trigger: number }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!trigger || !ctx || prefersReducedMotion()) return;
    return play(async (signal) => {
      const col = palette();
      const W = 30;
      const H = 24;
      for (const s of [1, 2, 2, 1]) {
        ctx.clearRect(0, 0, W, H);
        sprite(ctx, HEART, 15 - 4.5 * s, 12 - 4 * s, col, s);
        await frame(60, signal);
      }
      const bits = [
        [-1, -1],
        [1, -1],
        [-1.4, 0.2],
        [1.4, 0.2],
        [-0.6, -1.4],
        [0.6, -1.4],
      ];
      const colors = [col.p, col.b, col.g, col.o];
      for (let step = 1; step <= 3; step++) {
        ctx.clearRect(0, 0, W, H);
        bits.forEach(([dx, dy], i) => {
          ctx.fillStyle = colors[i % 4];
          ctx.fillRect(Math.round(15 + dx * step * 3), Math.round(12 + dy * step * 3), 1, 1);
        });
        await frame(60, signal);
      }
      ctx.clearRect(0, 0, W, H);
    });
  }, [trigger]);
  return (
    <canvas ref={canvas} className="pixel-heart-pop" width={30} height={24} aria-hidden="true" />
  );
};
export default PixelHeartPop;
