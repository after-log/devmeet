import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { frame, palette, play, prefersReducedMotion } from '@/lib/pixel';

const ROWS = ['resolve kakao account', 'create profile space', 'prepare today queue'];

/**
 * 가입 완료(후보 B · 빌드 로그): 세 줄이 차례로 찍히며 [ ok ]로 끝나고,
 * 아래 픽셀 막대가 파랑으로 차다가 다 차면 초록이 된다. 이어서 완료 문구가 나타난다.
 */
const SignupBuildLog = ({ name, onContinue }: { name?: string; onContinue: () => void }) => {
  const bar = useRef<HTMLCanvasElement>(null);
  const [lines, setLines] = useState(0);
  const [oks, setOks] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const ctx = bar.current?.getContext('2d');
    if (!ctx) return;
    return play(async (signal) => {
      const col = palette();
      const draw = (n: number) => {
        ctx.clearRect(0, 0, 64, 2);
        ctx.fillStyle = col.k;
        ctx.fillRect(0, 0, 64, 2);
        ctx.fillStyle = n >= 64 ? col.g : col.b;
        ctx.fillRect(0, 0, n, 2);
      };
      if (prefersReducedMotion()) {
        setLines(ROWS.length);
        setOks(ROWS.length);
        draw(64);
        return setDone(true);
      }
      draw(0);
      await frame(120, signal);
      for (let i = 0; i < ROWS.length; i++) {
        setLines(i + 1);
        for (let n = i * 21; n <= (i + 1) * 21; n += 3) {
          draw(n);
          await frame(16, signal);
        }
        setOks(i + 1);
        await frame(60, signal);
      }
      draw(64);
      await frame(140, signal);
      setDone(true);
    });
  }, []);

  return (
    <>
      <p className="prompt">
        <span>$</span>devmeet register --kakao
      </p>
      <div className="signup-log" aria-hidden="true">
        {ROWS.slice(0, lines).map((row, i) => (
          <div key={row}>
            <span>{row}</span>
            <b className={i < oks ? '' : 'invisible'}>ok</b>
          </div>
        ))}
      </div>
      <canvas ref={bar} className="signup-bar" width={64} height={2} aria-hidden="true" />
      <div className={done ? 'pixel-stepin' : 'invisible'} role="status">
        <h2 className="onboard-hero">
          가입이
          <br />
          완료됐어요.
        </h2>
        <p className="onboard-lead">
          {name ? `${name}님, ` : ''}이제 프로필을 만들어 볼까요?
          <br />네 단계면 충분해요.
        </p>
      </div>
      <button className="btn full" onClick={onContinue}>
        프로필 만들기 <ArrowRight className="ico" aria-hidden="true" />
      </button>
    </>
  );
};
export default SignupBuildLog;
