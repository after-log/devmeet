import { useMemberActions } from '@/hooks/queries/useMemberActions';
import { ChevronRight, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../stores/app';
import { Avatar } from '@/components/PersonCard';
import { useValueCatalog } from '@/hooks/useValueCatalog';
import { demoProfilePhoto } from '@/data/members';
import { publicValueAnswers, PUBLIC_VALUE_LIMIT } from '@/lib/value-answers';
import PageScene from '@/components/pixel/PageScene';
import { profilePhotos } from './profile-edit/fields';

const photoStatusLabels = new Map([
  ['APPROVED', '사진 검수 완료'],
  ['PENDING', '사진 검수 대기'],
  ['REJECTED', '사진 검수 반려'],
]);

const MePage = () => {
  const { logout } = useMemberActions();
  const navigate = useNavigate();
  const { user, demo, demoValueAnswers, openSheet } = useApp();
  const { sections: valueSections, loading: catalogLoading } = useValueCatalog(demo);
  const questions = valueSections.flatMap((section) => section.questions);
  const p = user?.profile;
  const name = p?.name ?? '체험 계정';
  const photoStatus = photoStatusLabels.get(user?.verification?.photoStatus ?? '') ?? '사진 미등록';
  const answers = demo ? demoValueAnswers : (p?.valueAnswers ?? {});
  const answered = questions.filter((q) => answers[q.id]?.choice != null).length;
  const publicAnswers = publicValueAnswers(answers, questions);
  const total = valueSections.reduce((sum, section) => sum + section.questions.length, 0);
  return (
    <>
      <h2>나의 프로필</h2>
      <PageScene name="profile" className="mt-4" />
      <div className="profile-self">
        <div className="shrink-0">
          <Avatar
            person={{ name, photo: p?.photos?.[0] || p?.photo || (demo ? demoProfilePhoto : '') }}
            size={56}
          />
        </div>
        <div className="min-w-0">
          <h3>
            {name}
            {p ? <span className="ml-2 font-mono text-[14px] text-fg-3">{p.age}</span> : null}
          </h3>
          <div className="flex flex-wrap items-baseline gap-x-2 text-xs leading-6 text-fg-3">
            <p className="m-0 wrap-anywhere">
              {p ? `${p.location} · ${p.job}` : '가입 없이 둘러보는 중이에요'}
            </p>
            {!demo && p && (
              <Link
                className="inline-flex items-center gap-0.5 rounded-sm hover:text-fg focus-visible:outline-2 focus-visible:outline-point"
                to="/me/edit/photos"
                state={{ fromMe: true }}
              >
                {photoStatus}
                <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
      {!demo && p && profilePhotos(p).length < 3 && (
        <div className="panel">
          <p className="text-sm">
            프로필 사진을 최소 3장 등록해 주세요. 사진 승인 후 다른 회원에게 공개돼요.
          </p>
          <Link className="btn full" to="/me/edit/photos" state={{ fromMe: true }}>
            사진 추가하기
          </Link>
        </div>
      )}
      <Link className="values-entry" to="/me/values">
        <span className="values-entry-icon" aria-hidden="true">
          <Heart className="size-5" fill="currentColor" />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm">나의 가치관</strong>
          <span className="mt-1 block text-xs text-fg-3">
            일상부터 연애까지, 나다운 답을 골라보세요.
          </span>
          <span className="mt-3 block font-mono text-[11px] text-point">
            {answered} / {catalogLoading && !total ? '…' : total} 답변 · 프로필 공개{' '}
            {publicAnswers.length} / {PUBLIC_VALUE_LIMIT}
          </span>
        </span>
        <ChevronRight className="size-5 text-fg-3" aria-hidden="true" />
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
      <Link className="settings-row" to="/me/verification">
        인증 관리
        <span>
          회사 · GitHub <ChevronRight className="ico" aria-hidden="true" />
        </span>
      </Link>
      {!demo && p && (
        <Link className="settings-row" to="/me/edit">
          프로필 편집
          <span>
            <ChevronRight className="ico" aria-hidden="true" />
          </span>
        </Link>
      )}
      <button className="settings-row" onClick={() => openSheet({ kind: 'filters' })}>
        추천 조건
        <span>
          {p?.region ? `${p.region} · ` : ''}
          {p ? `${p.minAge}–${p.maxAge}세` : '변경'}{' '}
          <ChevronRight className="ico" aria-hidden="true" />
        </span>
      </button>
      <button className="settings-row" onClick={() => openSheet({ kind: 'blocked' })}>
        차단한 프로필
        <span>
          <ChevronRight className="ico" aria-hidden="true" />
        </span>
      </button>
      <button className="settings-row" onClick={() => openSheet({ kind: 'privacy' })}>
        개인정보 안내
        <span>
          <ChevronRight className="ico" aria-hidden="true" />
        </span>
      </button>
      {!demo && user?.admin && (
        <Link className="settings-row" to="/admin">
          운영자 관리
          <span>
            <ChevronRight className="ico" aria-hidden="true" />
          </span>
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
        <span>
          <ChevronRight className="ico" aria-hidden="true" />
        </span>
      </button>
      <p className="tip">
        {demo ? '가상 프로필을 둘러보는 중이에요.' : '프로필과 대화는 서버에 안전하게 저장돼요.'}
      </p>
    </>
  );
};
export default MePage;
