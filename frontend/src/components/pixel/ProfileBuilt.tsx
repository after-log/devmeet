import { useEffect, useRef, useState } from 'react';
import type { Profile } from '@/types';
import { drawMosaic, frame, loadImage, palette, play, prefersReducedMotion } from '@/lib/pixel';

/**
 * 프로필 입력 완료: 내 사진이 굵은 모자이크(5→10→20칸)에서 선명해지고,
 * 코드 줄이 한 줄씩 컴파일되듯 찍힌 뒤 빌드 막대가 차고 ‘✓ build complete’가 뜬다.
 * 마지막에 카드 모서리에서 4색 픽셀이 한 번 튄다.
 */
const ProfileBuilt = ({ profile, onContinue }: { profile: Profile; onContinue: () => void }) => {
  const photo = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLCanvasElement>(null);
  const burst = useRef<HTMLCanvasElement>(null);
  const lines: [string, string][] = [
    ['name', profile.name],
    ['area', profile.location],
    ['meeting', profile.meeting],
  ];
  const [shown, setShown] = useState(0);
  const [built, setBuilt] = useState(false);

  useEffect(() => {
    const p = photo.current?.getContext('2d');
    const b = bar.current?.getContext('2d');
    const x = burst.current?.getContext('2d');
    if (!p || !b || !x) return;
    return play(async (signal) => {
      const col = palette();
      const img = await loadImage(profile.photo);
      const drawBar = (n: number) => {
        b.clearRect(0, 0, 60, 4);
        for (let i = 0; i < 10; i++) {
          b.fillStyle = i < n ? (n === 10 ? col.g : col.b) : col.k;
          b.fillRect(i * 6, 0, 5, 4);
        }
      };
      const W = p.canvas.width;
      const H = p.canvas.height;
      if (prefersReducedMotion()) {
        drawMosaic(p, img, 0, 0, W, H, 0, col.l);
        drawBar(10);
        setShown(lines.length + 2);
        return setBuilt(true);
      }
      drawBar(0);
      for (const n of [5, 10, 20]) {
        drawMosaic(p, img, 0, 0, W, H, n, col.l);
        await frame(130, signal);
      }
      drawMosaic(p, img, 0, 0, W, H, 0, col.l);
      for (let i = 1; i <= lines.length + 2; i++) {
        setShown(i);
        drawBar(Math.round((i / (lines.length + 2)) * 8));
        await frame(110, signal);
      }
      drawBar(9);
      await frame(80, signal);
      drawBar(10);
      setBuilt(true);
      const colors = [col.b, col.g, col.p, col.o];
      for (let step = 1; step <= 4; step++) {
        x.clearRect(0, 0, 60, 60);
        if (step < 4)
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 + 0.3;
            x.fillStyle = colors[i % 4];
            const s = i % 3 ? 2 : 3;
            x.fillRect(
              Math.round(44 + Math.cos(a) * 14 * (step / 3)),
              Math.round(14 + Math.sin(a) * 14 * (step / 3)),
              s,
              s,
            );
          }
        await frame(70, signal);
      }
    });
  }, [profile.photo]);

  const str = (v: string) => <span className="string">{JSON.stringify(v)}</span>;
  const code = [
    <>
      <span className="keyword">const</span> <span className="variable">me</span>
      {' = {'}
    </>,
    ...lines.map(([k, v]) => (
      <>
        {'\u00a0\u00a0'}
        {k}: {str(v)},
      </>
    )),
    <>{'};'}</>,
  ];

  return (
    <div className="relative">
      <p className="eyebrow">{built ? '// build complete' : '// compiling me.profile.ts'}</p>
      <h2 className="onboard-hero">
        프로필이
        <br />
        완성됐어요.
      </h2>
      <article className="profile">
        <div className="file-tab">
          <span className="file-icon">ts</span>
          me.profile.ts<span className="tab-end">{built ? '✓' : '•'}</span>
        </div>
        <canvas ref={photo} className="built-photo" width={320} height={240} aria-hidden="true" />
        <div className="code-block" aria-hidden="true">
          {code.slice(0, shown).map((line, i) => (
            <div className="code-line pixel-stepin" key={i}>
              <i>{String(i + 1).padStart(2, '0')}</i>
              <code>{line}</code>
            </div>
          ))}
        </div>
        <div className="built-status">
          <canvas ref={bar} width={60} height={4} aria-hidden="true" />
          <span className={built ? 'text-green' : ''} role="status">
            {built ? '✓ build complete' : 'building…'}
          </span>
        </div>
      </article>
      <canvas ref={burst} className="built-burst" width={60} height={60} aria-hidden="true" />
      <button className="btn full" onClick={onContinue}>
        오늘의 추천 3명 보기 →
      </button>
    </div>
  );
};
export default ProfileBuilt;
