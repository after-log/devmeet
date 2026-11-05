import { useEffect, useRef } from 'react';
import { palette, sprite } from '@/lib/pixel';

/** 깨진 픽셀 커서: 브랜드 커서가 두 조각으로 갈라지고 파편 몇 칸이 떨어진 그림. 실패 화면이라 움직이지 않는다. */
const BROKEN = [
  'bbbb.......',
  'bbbb.......',
  'bbbb...o...',
  'bbb........',
  '.....bbb...',
  '..o..bbbb..',
  '.....bbbb..',
  '.....bbbb..',
  '...........',
  'kkkkkkkkkkk',
];

const PixelBrokenCursor = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 11, 10);
    sprite(ctx, BROKEN, 0, 0, palette());
  }, []);
  return <canvas ref={canvas} className="pixel-broken" width={11} height={10} aria-hidden="true" />;
};
export default PixelBrokenCursor;
