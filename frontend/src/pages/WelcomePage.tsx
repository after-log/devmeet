import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../stores/app';
import SocialButtons from '@/components/SocialButtons';
import PageScene from '@/components/pixel/PageScene';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user, startDemo, openSheet, logout } = useApp();
  if (user?.profile) return <Navigate to="/today" replace />;
  // 로그인했지만 프로필이 없는 회원도 이 화면에 머물 수 있어야 온보딩에서 빠져나올 수 있다
  const signedUp = !!user;
  return (
    <>
      <p className="prompt">
        <span>$</span>devmeet init
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
      <PageScene name="welcome" className="mt-6" />
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
      {signedUp ? (
        <div className="mt-4 space-y-2">
          <button type="button" className="btn full" onClick={() => navigate('/onboarding')}>
            프로필 이어서 만들기
          </button>
          <button type="button" className="btn secondary full" onClick={() => void logout()}>
            로그아웃
          </button>
        </div>
      ) : (
        <SocialButtons />
      )}
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
        만 19세 이상 이용 가능
        <br />
        <button
          className="underline underline-offset-2"
          onClick={() => openSheet({ kind: 'social' })}
        >
          카카오 로그인 안내
        </button>
      </p>
    </>
  );
};
export default WelcomePage;
