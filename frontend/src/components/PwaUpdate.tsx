import { useRegisterSW } from 'virtual:pwa-register/react';

/** 새 버전을 확인하는 간격. 탭을 오래 열어 둬도 배포가 곧 반영되게 한다. */
const CHECK_EVERY = 60_000;

/**
 * 서비스 워커를 등록한다. 새 버전이 배포되면 자동으로 받아 바로 적용하고 화면을 새로 고친다.
 * (예전에는 '업데이트' 버튼을 눌러야 해서, 누르기 전까지 옛 화면이 계속 보였다.)
 */
const PwaUpdate = () => {
  useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        if (navigator.onLine) void registration.update();
      }, CHECK_EVERY);
    },
  });
  return null;
};

export default PwaUpdate;
