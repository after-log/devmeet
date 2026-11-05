import { useEffect, useRef } from 'react';
import { frame, palette, play, prefersReducedMotion, sprite } from '@/lib/pixel';

/** 오른쪽 위로 향하는 종이비행기: 밝은 윗날개(f) · 접힌 선(k) · 파란 아랫날개(b) */
export const PLANE = [
  '.............f',
  '..........ffff',
  '.......fffffff',
  '....ffffffffb.',
  '.fffffffffbb..',
  'ffffkkkbbbb...',
  '...kkkbbbb....',
  '.....kbbb.....',
  '.......bb.....',
];
const W = 96;
const H = 40;

/**
 * 대화방의 첫 메시지를 보냈을 때 종이비행기가 왼쪽 아래에서 오른쪽 위로 계단식으로 날아가며
 * 점선 자취를 남기고 화면 밖으로 사라진다. trigger 값이 바뀔 때 한 번 재생된다.
 */
const PixelPlane = ({ trigger }: { trigger: number }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!trigger || !ctx || prefersReducedMotion()) return;
    return play(async (signal) => {
      const col = palette();
      const trail: [number, number][] = [];
      for (let step = 0; step <= 16; step++) {
        ctx.clearRect(0, 0, W, H);
        const x = 2 + step * 5.6;
        const y = 30 - step * 1.6 - Math.sin(step / 3) * 1.5;
        trail.push([x, y + 6]);
        ctx.fillStyle = col.k;
        trail.forEach(([tx, ty], i) => {
          if (i % 2 === 0 && i < trail.length - 1)
            ctx.fillRect(Math.round(tx), Math.round(ty), 1, 1);
        });
        sprite(ctx, PLANE, Math.round(x), Math.round(y), col);
        await frame(45, signal);
      }
      // 자취가 뒤에서부터 한 칸씩 지워진다
      for (let i = 0; i < trail.length; i += 2) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = col.k;
        trail.slice(i + 2).forEach(([tx, ty], j) => {
          if (j % 2 === 0) ctx.fillRect(Math.round(tx), Math.round(ty), 1, 1);
        });
        await frame(25, signal);
      }
      ctx.clearRect(0, 0, W, H);
    });
  }, [trigger]);
  return <canvas ref={canvas} className="pixel-plane" width={W} height={H} aria-hidden="true" />;
};
export default PixelPlane;
