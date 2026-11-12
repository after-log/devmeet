import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * 서비스 워커를 등록한다. 새 버전이 배포되면 화면을 열거나 새로 고칠 때 자동으로 받아 바로 적용한다.
 * (예전에는 '업데이트' 버튼을 눌러야 해서, 누르기 전까지 옛 화면이 계속 보였다.)
 * 쓰는 도중에 화면이 바뀌지 않도록 주기적으로 확인하지는 않는다.
 */
const PwaUpdate = () => {
  useRegisterSW({ immediate: true });
  return null;
};

export default PwaUpdate;
