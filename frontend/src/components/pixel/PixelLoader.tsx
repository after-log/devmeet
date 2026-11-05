/** 서버 응답을 기다리는 동안 픽셀 3칸이 차례로 켜진다. 기다리는 동안만 보이는 유일한 반복 모션. */
const PixelLoader = ({ label = '보내는 중' }: { label?: string }) => (
  <span className="pixel-loader" role="status">
    <span className="pixel-dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
    {label}
  </span>
);
export default PixelLoader;
