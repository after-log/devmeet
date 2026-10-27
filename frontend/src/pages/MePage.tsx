import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../stores/app';
import { Avatar } from '@/components/PersonCard';

const MePage = () => {
  const navigate = useNavigate();
  const { user, demo, resetDraft, openSheet, logout } = useApp();
  const p = user?.profile;
  const name = p?.name ?? '체험 계정';
  return (
    <>
      <p className="eyebrow">// my.profile</p>
      <h2>나의 프로필</h2>
      <div className="profile-self">
        <div className="flex justify-center">
          <Avatar person={{ name, photo: p?.photo ?? '' }} size={72} />
        </div>
        <h3>
          {name}
          {p ? <span className="ml-2 font-mono text-[14px] text-fg-3">{p.age}</span> : null}
        </h3>
        <span className="muted">
          {p ? `${p.location} · ${p.job}` : '가입 없이 둘러보는 중이에요'}
        </span>
      </div>
      <div className="panel">
        <h3>인증 정보</h3>
        {[
          ['이메일', p ? '수신 미인증' : '—'],
          ['GitHub 연결', '미연결'],
          ['사진 확인', p?.photo ? '등록됨 · 미검토' : '미등록'],
        ].map(([k, v]) => (
          <div className="info-row" key={k}>
            <span>{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
        <p className="footnote text-left">서버 연동 전이라 외부 인증과 운영자 검토가 없어요.</p>
      </div>
      {!demo && p && (
        <button
          className="settings-row"
          onClick={() => {
            resetDraft({ ...p, tagsText: p.tags.join(', ') });
            navigate('/onboarding');
          }}
        >
          프로필 편집<span>›</span>
        </button>
      )}
      <button className="settings-row" onClick={() => openSheet({ kind: 'filters' })}>
        추천 조건
        <span>
          {p?.region ? `${p.region} · ` : ''}
          {p ? `${p.minAge}–${p.maxAge}세` : '변경'} ›
        </span>
      </button>
      <button className="settings-row" onClick={() => openSheet({ kind: 'blocked' })}>
        차단한 프로필<span>›</span>
      </button>
      <button className="settings-row" onClick={() => openSheet({ kind: 'social' })}>
        카카오 · GitHub 연결<span>준비 중 ›</span>
      </button>
      <button className="settings-row" onClick={() => openSheet({ kind: 'privacy' })}>
        개인정보 안내<span>›</span>
      </button>
      <Link className="settings-row" to="/admin">
        운영자 UI 체험<span>preview ›</span>
      </Link>
      <button
        className="settings-row"
        onClick={async () => {
          await logout();
          navigate('/');
        }}
      >
        {demo ? '둘러보기 종료' : '로그아웃'}
        <span>›</span>
      </button>
      <p className="tip">서버 연동 전 UI 체험이에요. 가입 정보는 이 브라우저에만 저장돼요.</p>
    </>
  );
};
export default MePage;
