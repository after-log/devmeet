// 라이트/다크 테마를 읽고 html data-theme·localStorage에 반영하는 헬퍼
export type Theme = 'light' | 'dark';

export const getTheme = (): Theme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

export const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document.querySelector<HTMLMetaElement>('meta[name=theme-color]')!.content =
    theme === 'light' ? '#ffffff' : '#1e1f22';
  try {
    localStorage.setItem('devmeet.theme', theme);
  } catch {
    // 저장 실패 시 이번 방문에만 적용
  }
};
