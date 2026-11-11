import { useEffect, useRef, useState } from 'react';
import { DIGITS, palette, secondsToKstMidnight } from '@/lib/pixel';

const pad = (n: number) => String(n).padStart(2, '0');
const format = (left: number) =>
  `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;

/** 내일 추천까지 남은 시간을 픽셀 숫자로 보여 준다. 초 단위만 조용히 바뀐다. */
const PixelCountdown = ({ label = '내일 새 추천까지' }: { label?: string }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [left, setLeft] = useState(secondsToKstMidnight);
  useEffect(() => {
    const id = setInterval(() => setLeft(secondsToKstMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const col = palette();
    ctx.clearRect(0, 0, 41, 9);
    let x = 1;
    for (const ch of format(left)) {
      const glyph = DIGITS[ch];
      glyph.forEach((row, y) =>
        [...row].forEach((v, dx) => {
          if (v !== '1') return;
          ctx.fillStyle = ch === ':' ? col.g : col.f;
          ctx.fillRect(x + dx, 2 + y, 1, 1);
        }),
      );
      x += glyph[0].length + 1;
    }
  }, [left]);
  return (
    <div className="pixel-countdown">
      <p className="section-comment !mb-2">// {label}</p>
      <canvas
        ref={canvas}
        width={41}
        height={9}
        role="img"
        aria-label={`${label} ${format(left)}`}
      />
    </div>
  );
};
export default PixelCountdown;
