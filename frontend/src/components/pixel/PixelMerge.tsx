import { useEffect, useRef } from 'react';
import { drawMosaic, frame, loadImage, palette, play, prefersReducedMotion } from '@/lib/pixel';

/**
 * 매칭: 두 사람의 사진 아래에서 파랑(나)·초록(상대) 브랜치가 내려와
 * 가운데의 보라 머지 커밋에서 만난다. 브랜치가 자랄수록 사진이 모자이크에서 선명해진다.
 * 끝나면 onDone을 불러 문구를 보여 준다.
 */
const W = 60;
const H = 40;
const K = 6; // 캔버스 1칸 = 6px
const S = 14;
const L = { x: 12, y: 2 };
const R = { x: W - 12 - S, y: 2 };
const NODE = { x: 30, y: 32 };

const branch = (sx: number) => {
  const pts: [number, number][] = [];
  const dx = Math.abs(NODE.x - sx);
  let x = sx;
  let y = 17;
  while (y < NODE.y - dx) pts.push([x, y++]);
  while (Math.abs(NODE.x - x) > 1) {
    x += x < NODE.x ? 1 : -1;
    y++;
    pts.push([x, y]);
  }
  return pts;
};
const LEFT = branch(L.x + S / 2 - 1);
const RIGHT = branch(R.x + S / 2);

const PixelMerge = ({ me, you, onDone }: { me: string; you: string; onDone: () => void }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    return play(async (signal) => {
      const col = palette();
      const [a, b] = await Promise.all([loadImage(me), loadImage(you)]);
      const px = (x: number, y: number, c: string, w = 1, h = 1) => {
        ctx.fillStyle = c;
        ctx.fillRect(x * K, y * K, w * K, h * K);
      };
      const draw = (progress: number, n: number, merged: boolean, ring: number, tail: number) => {
        ctx.clearRect(0, 0, W * K, H * K);
        (
          [
            [L, a],
            [R, b],
          ] as const
        ).forEach(([pos, img]) => {
          px(pos.x - 0.5, pos.y - 0.5, col.k, S + 1, S + 1);
          drawMosaic(ctx, img, pos.x * K, pos.y * K, S * K, S * K, n, col.l);
        });
        const nl = Math.round(LEFT.length * progress);
        const nr = Math.round(RIGHT.length * progress);
        LEFT.slice(0, nl).forEach(([x, y]) => px(x, y, col.b));
        RIGHT.slice(0, nr).forEach(([x, y]) => px(x, y, col.g));
        if (nl && progress < 1) px(LEFT[nl - 1][0] - 0.5, LEFT[nl - 1][1] - 0.5, col.b, 2, 2);
        if (nr && progress < 1) px(RIGHT[nr - 1][0] - 0.5, RIGHT[nr - 1][1] - 0.5, col.g, 2, 2);
        if (merged) px(NODE.x - 1, NODE.y - 1, col.p, 3, 3);
        if (ring) {
          ctx.globalAlpha = ring === 1 ? 0.6 : 0.3;
          const r = ring + 2;
          for (let i = -r; i <= r; i++) {
            px(NODE.x + i, NODE.y - r, col.p);
            px(NODE.x + i, NODE.y + r, col.p);
            px(NODE.x - r, NODE.y + i, col.p);
            px(NODE.x + r, NODE.y + i, col.p);
          }
          ctx.globalAlpha = 1;
        }
        for (let y = NODE.y + 2; y < NODE.y + 2 + tail; y++) px(NODE.x, y, col.p);
      };
      if (prefersReducedMotion()) {
        draw(1, 0, true, 0, 6);
        return done.current();
      }
      const mosaicAt = (p: number) => (p < 0.25 ? 4 : p < 0.5 ? 7 : p < 0.75 ? 14 : 28);
      for (let i = 0; i <= 14; i++) {
        draw(i / 14, mosaicAt(i / 14), false, 0, 0);
        await frame(55, signal);
      }
      draw(1, 0, true, 0, 0);
      await frame(90, signal);
      for (const r of [1, 2]) {
        draw(1, 0, true, r, 0);
        await frame(80, signal);
      }
      for (let t = 1; t <= 6; t++) {
        draw(1, 0, true, 0, t);
        await frame(30, signal);
      }
      done.current();
    });
  }, [me, you]);

  return (
    <canvas
      ref={canvas}
      className="pixel-merge"
      width={W * K}
      height={H * K}
      role="img"
      aria-label="두 사람의 브랜치가 하나로 합쳐졌어요"
    />
  );
};
export default PixelMerge;
