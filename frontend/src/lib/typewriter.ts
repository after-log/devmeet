// 화면 안의 라벨 → 제목 → 본문을 한글 자모 조합 방식(ㅇ → 오 → 오늘)으로 타이핑한다.
// 두꺼운 포인트 컬러 블록 커서가 따라오다 끝나면 사라진다.
// React가 관리하는 DOM 노드를 바꾸지 않도록 텍스트 노드의 nodeValue만 바꾸고, 커서는 body에 떠 있는 별도 요소로 그린다.
import { useEffect } from 'react';
import { prefersReducedMotion } from './pixel';

/** 타이핑할 요소. 순서는 화면에 나온 순서(DOM 순서)를 따른다. */
const TARGETS = [
  '.eyebrow',
  '.prompt',
  '.topline h2',
  '.onboard-hero',
  '.onboard-lead',
  '.intro',
  '.empty h2',
  '.empty h3',
  '.empty p',
].join(',');
/** 이 안에 있으면 타이핑하지 않는다: 버튼·링크·입력칸, 프로필·코드 카드, 로고, 직접 끈 곳 */
// .invisible: 픽셀 장면(가입 완료·매칭)이 끝난 뒤 드러나는 문구. 자체 연출이 있어 타이핑하지 않는다
const SKIP =
  'button, a, input, textarea, label, .profile, .logo, .invisible, [data-no-type], [role="dialog"]';

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
/** 한 글자를 입력 단계로 나눈다. '늘' → ['ㄴ', '느', '늘'] */
export const hangulSteps = (ch: string) => {
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return [ch];
  const cho = Math.floor(code / 588);
  const jung = Math.floor((code % 588) / 28);
  const jong = code % 28;
  const base = String.fromCharCode(0xac00 + cho * 588 + jung * 28);
  return jong ? [CHO[cho], base, ch] : [CHO[cho], ch];
};

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('aborted', 'AbortError'));
    const id = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });

const textNodes = (el: Element) => {
  const out: Text[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode())
    if ((n as Text).nodeValue?.trim()) out.push(n as Text);
  return out;
};

/** 제목류는 천천히, 긴 본문은 빠르게. 본문도 1초 안팎에서 끝나게 맞춘다. */
const pace = (el: Element, length: number) => {
  const title = el.matches('.onboard-hero, .topline h2, .empty h2, .empty h3');
  if (title) return 38;
  return Math.max(6, Math.min(14, Math.round(900 / Math.max(1, length * 2.2))));
};

const caretEl = () => {
  const c = document.createElement('i');
  c.className = 'type-caret';
  c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  return c;
};

const placeCaret = (caret: HTMLElement, node: Text, el: Element) => {
  const range = document.createRange();
  const len = node.nodeValue?.length ?? 0;
  range.setStart(node, len);
  range.setEnd(node, len);
  const rects = range.getClientRects();
  const style = getComputedStyle(el);
  const size = parseFloat(style.fontSize) || 14;
  let x: number;
  let y: number;
  if (rects.length) {
    const r = rects[rects.length - 1];
    x = r.right;
    y = r.top + (r.height - size) / 2;
  } else {
    const r = (node.parentElement ?? el).getBoundingClientRect();
    x = r.left;
    y = r.top;
  }
  caret.style.cssText = `left:${x + 1}px;top:${y}px;width:${size * 0.5}px;height:${size}px`;
};

/**
 * root 안의 대상 요소를 순서대로 타이핑한다. 시작할 때 모두 비우고(높이는 유지해 화면이 밀리지 않게),
 * 하나씩 채운다. 중간에 취소되면 원래 글자를 즉시 되돌린다.
 */
export async function typeIn(root: Element, signal: AbortSignal, seen = played) {
  const targets = [...root.querySelectorAll(TARGETS)].filter((el) => {
    if (el.closest(SKIP) || !textNodes(el).length) return false;
    const text = el.textContent?.trim() ?? '';
    if (seen.has(text)) return false;
    seen.add(text);
    return true;
  });
  remember(seen);
  if (!targets.length) return;
  const jobs = targets.map((el) => {
    const nodes = textNodes(el);
    const original = nodes.map((n) => n.nodeValue ?? '');
    const minHeight = (el as HTMLElement).style.minHeight;
    (el as HTMLElement).style.minHeight = `${el.getBoundingClientRect().height}px`;
    return { el: el as HTMLElement, nodes, original, minHeight };
  });
  // 우리가 마지막으로 쓴 값. React가 그사이 다른 값으로 바꾼 노드는 되돌리지 않는다
  const written = new Map<Text, string>();
  const write = (n: Text, v: string) => {
    n.nodeValue = v;
    written.set(n, v);
  };
  const restore = () =>
    jobs.forEach((j) => {
      j.nodes.forEach((n, i) => {
        if (n.isConnected && n.nodeValue === written.get(n)) n.nodeValue = j.original[i];
      });
      j.el.style.minHeight = j.minHeight;
    });
  jobs.forEach((j) => j.nodes.forEach((n) => write(n, '')));
  const caret = caretEl();
  // 타이핑하는 동안 화면에 고정된 깜빡이 커서(.focus-caret)는 숨긴다
  root.setAttribute('data-typing', '');
  try {
    for (const job of jobs) {
      const total = job.original.join('').length;
      const per = pace(job.el, total);
      for (let k = 0; k < job.nodes.length; k++) {
        const node = job.nodes[k];
        if (!node.isConnected) continue;
        let out = '';
        for (const ch of job.original[k]) {
          for (const step of hangulSteps(ch)) {
            // React가 그사이 글자를 바꿨다면 손대지 않고 끝낸다
            if (node.nodeValue !== written.get(node))
              throw new DOMException('changed', 'AbortError');
            write(node, out + step);
            placeCaret(caret, node, job.el);
            if (ch.trim()) await sleep(per, signal);
          }
          out += ch;
        }
      }
      job.el.style.minHeight = job.minHeight;
      await sleep(70, signal);
    }
    await sleep(160, signal);
  } finally {
    caret.remove();
    root.removeAttribute('data-typing');
    restore();
  }
}

/** 이번 세션에 이미 타이핑한 문구. 같은 문구는 다시 타이핑하지 않는다. */
const STORE = 'devmeet.typed';
const played: Set<string> = (() => {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(STORE) ?? '[]') as string[]);
  } catch {
    return new Set<string>();
  }
})();
function remember(seen: Set<string>) {
  try {
    sessionStorage.setItem(STORE, JSON.stringify([...seen].slice(-300)));
  } catch {
    // 저장 공간이 없으면 이번 방문 동안만 기억한다
  }
}

/**
 * main 안에 새 문구(라벨·제목·본문)가 나타나면 타이핑한다. 화면이 바뀌거나, 같은 화면에서
 * 데이터를 불러와 새 문구가 생겨도 동작한다. 이미 타이핑한 문구는 세션 동안 다시 타이핑하지 않는다.
 * 모션 줄이기 설정이면 재생하지 않는다.
 */
export const useRouteTyping = (key: string, ready: boolean, getRoot: () => Element | null) => {
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;
    const root = getRoot();
    if (!root) return;
    const controller = new AbortController();
    let typing = false;
    let timer = 0;
    const check = () => {
      clearTimeout(timer);
      // 데이터가 그려진 직후에 확인한다 (보이지 않는 탭에서도 멈추지 않도록 rAF 대신 타이머)
      timer = window.setTimeout(() => {
        if (typing || controller.signal.aborted) return;
        typing = true;
        typeIn(root, controller.signal)
          .catch((err) => {
            if ((err as Error).name !== 'AbortError') console.error(err);
          })
          .finally(() => {
            typing = false;
          });
      }, 16);
    };
    const observer = new MutationObserver(() => {
      if (!typing) check();
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    check();
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, ready, getRoot]);
};
