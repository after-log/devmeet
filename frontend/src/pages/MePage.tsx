import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../stores/app';
import { Avatar } from '@/components/PersonCard';
import valueSections from '@/data/value-questions.json';
import { demoProfilePhoto } from '@/data/members';
import { publicValueAnswers, PUBLIC_VALUE_LIMIT } from '@/lib/value-answers';
import { request } from '@/lib/api';
import { toast } from 'sonner';

const MePage = () => {
  const navigate = useNavigate();
  const { user, demo, demoValueAnswers, resetDraft, openSheet, logout } = useApp();
  const p = user?.profile;
  const name = p?.name ?? '체험 계정';
  const answers = demo ? demoValueAnswers : (p?.valueAnswers ?? {});
  const answered = Object.values(answers).filter((answer) => answer.choice !== null).length;
  const publicAnswers = publicValueAnswers(answers);
  const total = valueSections.reduce((sum, section) => sum + section.questions.length, 0);
  return (
    <>
      <p className="eyebrow">// my.profile</p>
      <h2>나의 프로필</h2>
      <div className="profile-self">
        <div className="flex justify-center">
          <Avatar person={{ name, photo: demo ? demoProfilePhoto : (p?.photo ?? '') }} size={72} />
        </div>
        <h3>
          {name}
          {p ? <span className="ml-2 font-mono text-[14px] text-fg-3">{p.age}</span> : null}
        </h3>
        <span className="muted">
          {p ? `${p.location} · ${p.job}` : '가입 없이 둘러보는 중이에요'}
        </span>
      </div>
      <Link className="values-entry" to="/me/values">
        <span className="values-entry-icon" aria-hidden="true">
          ♡
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm">나의 가치관</strong>
          <span className="mt-1 block text-xs text-fg-3">
            일상부터 연애까지, 나다운 답을 골라보세요.
          </span>
          <span className="mt-3 block font-mono text-[11px] text-blue">
            {answered} / {total} 답변 · 프로필 공개 {publicAnswers.length} / {PUBLIC_VALUE_LIMIT}
          </span>
        </span>
        <span className="text-xl text-fg-3" aria-hidden="true">
          ›
        </span>
      </Link>
      {publicAnswers.length > 0 && (
        <section className="panel" aria-label="프로필에 공개하는 가치관">
          <h3>나의 가치관 · 공개 {publicAnswers.length}개</h3>
          <div className="space-y-5">
            {publicAnswers.map((answer) => (
              <div key={answer.id}>
                <p className="mt-0 mb-1 text-xs text-fg-3">{answer.text}</p>
                <p className="m-0 text-sm text-fg">{answer.choice}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="panel">
        <h3>인증 정보</h3>
        {[
          ['이메일', !demo && user?.verification?.email ? '수신 확인 완료' : '수신 미인증'],
          ['GitHub 연결', !demo && user?.verification?.github ? '연결 완료' : '미연결'],
          [
            '사진 확인',
            demo
              ? '체험 사진'
              : ({ APPROVED: '검수 승인', PENDING: '검수 대기', REJECTED: '반려', NONE: '미등록' }[
                  user?.verification?.photoStatus ?? 'NONE'
                ] ?? '미등록'),
          ],
        ].map(([k, v]) => (
          <div className="info-row" key={k}>
            <span>{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
        {user?.verification?.photoReviewReason && (
          <p className="footnote text-left">{user.verification.photoReviewReason}</p>
        )}
        {!demo && !user?.verification?.email && (
          <button
            className="mt-3 text-xs text-blue"
            onClick={async () => {
              try {
                await request('/auth/email/request', 'POST');
                toast('인증 메일을 보냈어요.');
              } catch (err) {
                toast((err as Error).message);
              }
            }}
          >
            이메일 인증 메일 받기
          </button>
        )}
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
        카카오 · GitHub 연결<span>›</span>
      </button>
      <button className="settings-row" onClick={() => openSheet({ kind: 'privacy' })}>
        개인정보 안내<span>›</span>
      </button>
      {!demo && user?.admin && (
        <Link className="settings-row" to="/admin">
          운영자 관리<span>›</span>
        </Link>
      )}
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
      <p className="tip">
        {demo ? '가상 프로필을 둘러보는 중이에요.' : '프로필과 대화는 서버에 안전하게 저장돼요.'}
      </p>
    </>
  );
};
export default MePage;
