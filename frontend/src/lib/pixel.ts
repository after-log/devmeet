// 픽셀 인터랙션 공용 도구. 색은 style.css의 테마 토큰을 그대로 읽어 다크·라이트 모드를 따른다.
// 움직임은 계단식(프레임 단위)으로만 그리고, 모션 줄이기 설정이면 끝 상태만 보여 준다.
import { useEffect, useState } from 'react';

export type Palette = Record<'b' | 'g' | 'p' | 'o' | 'f' | 'k' | 's' | 'l', string>;

export const palette = (): Palette => {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(`--color-${name}`).trim();
  return {
    b: v('point'),
    g: v('green'),
    p: v('sub'),
    o: v('orange'),
    f: v('fg'),
    k: v('line-strong'),
    s: v('surface'),
    l: v('lift'),
  };
};

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useReducedMotion = () => {
  const [reduce, setReduce] = useState(prefersReducedMotion);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduce(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduce;
};

/** 취소 가능한 대기. 화면이 바뀌면 AbortSignal로 남은 프레임을 멈춘다. */
export const frame = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('aborted', 'AbortError'));
    const id = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });

/** 애니메이션을 실행하고, 중간에 취소되면 조용히 끝낸다. */
export const play = (run: (signal: AbortSignal) => Promise<void>) => {
  const controller = new AbortController();
  run(controller.signal).catch((err) => {
    if ((err as Error).name !== 'AbortError') console.error(err);
  });
  return () => controller.abort();
};

/** 문자열 배열로 그린 스프라이트. '.'은 투명, 나머지 글자는 팔레트 키. */
export const sprite = (
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x0: number,
  y0: number,
  colors: Palette,
  scale = 1,
) => {
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const c = colors[ch as keyof Palette];
      if (ch === '.' || !c) return;
      ctx.fillStyle = c;
      ctx.fillRect(x0 + x * scale, y0 + y * scale, scale, scale);
    }),
  );
};

const images = new Map<string, Promise<HTMLImageElement | null>>();
export const loadImage = (src: string) => {
  if (!images.has(src))
    images.set(
      src,
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      }),
    );
  return images.get(src)!;
};

const scratch = typeof document !== 'undefined' ? document.createElement('canvas') : null;
/**
 * 사진을 n칸 모자이크로 그린다. n이 0이면 선명하게. 목표 비율에 맞춰 가운데(얼굴이 있는 위쪽)를 자른다.
 * 픽셀 값을 읽지 않으므로 다른 도메인 사진이어도 CORS 문제가 없다.
 */
export const drawMosaic = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  n = 0,
  fallback = '#2b2d30',
) => {
  if (!img || !img.naturalWidth) {
    ctx.fillStyle = fallback;
    ctx.fillRect(x, y, w, h);
    return;
  }
  const ratio = w / h;
  let sw = img.naturalWidth;
  let sh = sw / ratio;
  if (sh > img.naturalHeight) {
    sh = img.naturalHeight;
    sw = sh * ratio;
  }
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) * 0.3;
  if (!n || n >= w || !scratch) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    return;
  }
  const nh = Math.max(1, Math.round(n / ratio));
  scratch.width = n;
  scratch.height = nh;
  const t = scratch.getContext('2d')!;
  t.imageSmoothingEnabled = true;
  t.drawImage(img, sx, sy, sw, sh, 0, 0, n, nh);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(scratch, 0, 0, n, nh, x, y, w, h);
};

export const HEART = [
  '.pp...pp.',
  'pppp.pppp',
  'ppppppppp',
  'ppppppppp',
  '.ppppppp.',
  '..ppppp..',
  '...ppp...',
  '....p....',
];

/** 3×5 픽셀 숫자 */
export const DIGITS: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  ':': ['0', '1', '0', '1', '0'],
};

/** 한국 시간 자정까지 남은 초 */
export const secondsToKstMidnight = (now = Date.now()) => {
  const kst = new Date(now + 9 * 3600_000);
  return 86400 - (kst.getUTCHours() * 3600 + kst.getUTCMinutes() * 60 + kst.getUTCSeconds());
};
