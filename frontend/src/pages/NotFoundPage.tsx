import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="empty">
    <div className="big">// 404</div>
    <h2>페이지를 찾을 수 없어요</h2>
    <p>주소를 확인하거나 발견 화면으로 이동해 주세요.</p>
    <Link className="btn full inline-block" to="/discover">
      발견으로 이동
    </Link>
  </div>
);
export default NotFoundPage;
