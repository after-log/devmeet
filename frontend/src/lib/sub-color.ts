// 서브색 고르기: 메인색보다 덜 튀는 색을 회색·보색·어울리는 색·랜덤 중에서 고르고 html에 반영한다.
export type SubMode = 'gray' | 'complement' | 'harmony' | 'random';

export const SUB_MODES: SubMode[] = ['gray', 'complement', 'harmony', 'random'];
export const SUB_LABEL: Record<SubMode, string> = {
  gray: '회색',
  complement: '보색',
  harmony: '어울리는 색',
  random: '랜덤',
};

// 메인색(--color-point #5865f2)의 색상각. 메인색을 바꾸면 이 값도 함께 바꾼다
const MAIN_HUE = 235;
const KEY = 'devmeet.sub';

const paint = (mode: SubMode, hue: number) => {
  const root = document.documentElement.style;
  if (mode === 'gray') {
    root.setProperty('--sub', '#b4b4b4');
    root.setProperty('--sub-line', '#3a3a3a');
  } else {
    // 채도를 낮게 잡아 메인색보다 덜 튀게 한다
    root.setProperty('--sub', `hsl(${Math.round(hue)} 38% 70%)`);
    root.setProperty('--sub-line', `hsl(${Math.round(hue)} 22% 26%)`);
  }
};

const hueFor = (mode: SubMode) =>
  mode === 'complement' ? MAIN_HUE + 180 : mode === 'harmony' ? MAIN_HUE + 40 : Math.random() * 360;

export const getSubMode = (): SubMode => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { mode?: SubMode } | null;
    if (saved?.mode && SUB_MODES.includes(saved.mode)) return saved.mode;
  } catch {
    // 저장된 값이 없거나 읽을 수 없으면 회색
  }
  return 'gray';
};

export const applySubMode = (mode: SubMode) => {
  const hue = hueFor(mode) % 360;
  paint(mode, hue);
  try {
    localStorage.setItem(KEY, JSON.stringify({ mode, hue }));
  } catch {
    // 저장 실패 시 이번 방문에만 적용
  }
};

export const nextSubMode = (mode: SubMode): SubMode =>
  SUB_MODES[(SUB_MODES.indexOf(mode) + 1) % SUB_MODES.length];
