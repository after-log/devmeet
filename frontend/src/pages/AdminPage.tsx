import { useState } from 'react';
import { Link } from 'react-router-dom';
const AdminPage = () => {
  const [approved, setApproved] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState(false);
  return (
    <>
      <p className="eyebrow">// admin.preview</p>
      <h2>베타 운영</h2>
      <p className="intro">UI 체험용 가상 데이터입니다.</p>
      <div className="panel">
        <h3>사용자 풀</h3>
        <p className="muted">
          개발자 60명 · 비개발자 60명
          <br />
          남성 60명 · 여성 60명
          <br />
          가입 채널: 커뮤니티 80명 · 지인 40명
        </p>
      </div>
      <div className="panel">
        <h3>사진 검수 · 24시간 이내</h3>
        {['민준', '서연', '하은'].map((name) => (
          <div key={name} className="listrow">
            <div>
              <strong>{name}</strong>
              <small>
                {approved.includes(name)
                  ? '사진 승인 · 추천 가능'
                  : '사진 대기 · 회사 이메일 인증 완료'}
              </small>
            </div>
            <button
              className="tag"
              disabled={approved.includes(name)}
              onClick={() => setApproved([...approved, name])}
            >
              {approved.includes(name) ? '완료' : '승인 체험'}
            </button>
          </div>
        ))}
      </div>
      <div className="panel">
        <h3>신고 검토</h3>
        <p className="muted">예시 사용자 · 부적절한 프로필 신고 1건</p>
        <button
          className="btn secondary full"
          disabled={reviewed}
          onClick={() => setReviewed(true)}
        >
          {reviewed ? '검토 완료 (데모)' : '검토 완료 처리'}
        </button>
      </div>
      <div className="panel">
        <h3>전환 퍼널 · 예시</h3>
        <p className="muted">
          추천 노출 100 → 좋아요 18
          <br />
          좋아요 18 → 매칭 3<br />
          매칭 3 → 첫 메시지 2
        </p>
      </div>
      <Link to="/me" className="back">
        ← 내 프로필로 돌아가기
      </Link>
    </>
  );
};
export default AdminPage;
