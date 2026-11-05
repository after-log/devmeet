import { useEffect, useRef } from 'react';
import { frame, palette, play, prefersReducedMotion, sprite } from '@/lib/pixel';

const FULL = ['.pp.pp.', 'ppppppp', 'ppppppp', '.ppppp.', '..ppp..', '...p...'];
const EMPTY = ['.kk.kk.', 'k..k..k', 'k.....k', '.k...k.', '..k.k..', '...k...'];

/**
 * 남은 좋아요를 픽셀 하트 3칸으로 보여 준다. 하나를 쓰면 그 칸이 두 번 깜빡이고 빈 하트가 된다.
 */
const PixelHearts = ({ remaining, total = 3 }: { remaining: number; total?: number }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const previous = useRef(remaining);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const left = Math.max(0, Math.min(total, remaining));
    const before = previous.current;
    previous.current = left;
    const draw = (filled: number, extra = -1) => {
      const col = palette();
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      for (let i = 0; i < total; i++)
        sprite(ctx, i < filled || i === extra ? FULL : EMPTY, 1 + i * 10, 1, col);
    };
    // 하나 줄었을 때만 깜빡인다. 처음 그리거나 늘어날 때(새 날)는 바로 그린다
    if (before <= left || prefersReducedMotion()) return draw(left);
    return play(async (signal) => {
      for (let i = 0; i < 2; i++) {
        draw(left, left);
        await frame(90, signal);
        draw(left);
        await frame(90, signal);
      }
      draw(left);
    });
  }, [remaining, total]);

  return (
    <canvas
      ref={canvas}
      className="pixel-hearts"
      width={total * 10 + 1}
      height={8}
      role="img"
      aria-label={`오늘 남은 좋아요 ${total}개 중 ${Math.max(0, remaining)}개`}
    />
  );
};
export default PixelHearts;
