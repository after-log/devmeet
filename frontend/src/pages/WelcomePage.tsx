import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../stores/app';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user, startDemo, openSheet } = useApp();
  if (user?.profile) return <Navigate to="/today" replace />;
  if (user) return <Navigate to="/onboarding" replace />;
  return (
    <>
      <p className="prompt">
        <span>$</span>devmeet init
        <i className="cursor" />
      </p>
      <h2 className="onboard-hero">
        당신의 일상에,
        <br />
        새로운 연결.
      </h2>
      <p className="onboard-lead">
        개발자와 개발자를 만나고 싶은 사람을 위한,
        <br />
        하루 세 번의 새로운 가능성.
      </p>
      <ul className="checks">
        <li>
          <b>01</b>매일 세 사람만 소개하고, 그날 하루 동안 유지돼요
        </li>
        <li>
          <b>02</b>만남·연락의 리듬이 맞는 사람을 먼저 보여 줘요
        </li>
        <li>
          <b>03</b>서로 좋아요를 보냈을 때만 대화가 열려요
        </li>
      </ul>
      <button className="btn full" onClick={() => navigate('/auth/register')}>
        이메일로 시작하기 →
      </button>
      <button className="btn secondary mt-[10px] w-full" onClick={() => navigate('/auth/login')}>
        이미 계정이 있어요
      </button>
      <button
        className="skip"
        onClick={() => {
          startDemo();
          navigate('/today');
        }}
      >
        가입 없이 화면 둘러보기
      </button>
      <p className="footnote">
        만 19세 이상 이용 가능 · 서버 연동 전 UI 체험
        <br />
        <button
          className="underline underline-offset-2"
          onClick={() => openSheet({ kind: 'social' })}
        >
          카카오 · GitHub 연결 안내
        </button>
      </p>
    </>
  );
};
export default WelcomePage;
