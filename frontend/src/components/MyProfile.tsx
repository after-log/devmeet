import { useState } from 'react';
import { useDevmeetStore } from '../stores/devmeet';
import { Link } from 'react-router-dom';
import type { SignupProfile } from '../types';
import { valueTags } from './CodeCard';
const MyProfile = ({
  profile,
  onJump,
  onSettings,
  onReplay,
}: {
  profile: SignupProfile;
  onJump: (step: number) => void;
  onSettings: () => void;
  onReplay: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const setProfile = useDevmeetStore((s) => s.setProfile);
  return (
    <>
      <p className="eyebrow">// my.profile</p>
      <h2>나의 프로필</h2>
      <div className="profile-self">
        <div className="small-avatar">ME</div>
        <h3>{profile.nick || '내 프로필'}</h3>
        <span className="muted">
          {profile.role === 'other' ? '개발자를 만나고 싶은 사람' : '개발자'} · 체험 프로필
        </span>
      </div>
      <div className="panel">
        <h3>프로필 인증</h3>
        <p className="muted">나에게 필요한 인증을 확인해 보세요.</p>
        <button className="btn full" onClick={() => onJump(2)}>
          인증 체험하기
        </button>
      </div>
      <button className="settings-row" onClick={() => setEditing(!editing)}>
        추가 프로필 정보<span>{editing ? '닫기' : '직장 · 학교 · 키워드 ›'}</span>
      </button>
      {editing && (
        <div className="panel">
          {[
            ['company', '직장 (선택)'],
            ['school', '학교 (선택)'],
            ['keywords', '키워드 · 최대 5개 (선택)'],
          ].map(([key, title]) => (
            <label className="formlabel" key={key}>
              {title}
              <input
                className="mt-2"
                value={profile.details?.[key] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setProfile((current) => ({
                    ...current,
                    details: { ...current.details, [key]: value },
                  }));
                }}
              />
            </label>
          ))}
          <p className="footnote">현재 UI에만 반영되는 선택 정보예요.</p>
        </div>
      )}
      <button className="settings-row" onClick={() => onJump(11)}>
        만남·연락 빈도<span>변경 ›</span>
      </button>
      <button className="settings-row" onClick={() => onJump(4)}>
        만나고 싶은 사람
        <span>
          {profile.pref === 'dev' ? '개발자' : profile.pref === 'other' ? '비개발자' : '상관없어요'}{' '}
          ›
        </span>
      </button>
      <button className="settings-row" onClick={onSettings}>
        만남 선호 설정<span>변경 ›</span>
      </button>
      <button className="settings-row" onClick={() => onJump(3)}>
        추가 가치관 O/X · 선택
        <span>
          {valueTags(profile).length ? `${valueTags(profile).length} / 8 답변` : '시작'} ›
        </span>
      </button>
      <button className="settings-row" onClick={onReplay}>
        가입 흐름 처음부터 보기<span>init ›</span>
      </button>
      <Link className="settings-row" to="/admin">
        운영자 UI 체험<span>preview ›</span>
      </Link>
      <p className="tip">이 목업의 프로필과 인증 내역은 가상 데이터입니다.</p>
    </>
  );
};
export default MyProfile;
