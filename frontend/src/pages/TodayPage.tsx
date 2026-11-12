import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reasonFor, useApp } from '../stores/app';
import PersonCard, { Empty } from '@/components/PersonCard';
import LikeButton from '@/components/LikeButton';
import PixelCountdown from '@/components/pixel/PixelCountdown';
import PixelHearts from '@/components/pixel/PixelHearts';

const TodayPage = () => {
  const navigate = useNavigate();
  const { people, index, setIndex, liked, remaining, demo, user, openSheet, refresh, notice } =
    useApp();
  const p = people[index];
  const dev = (user?.profile?.role ?? 'developer') === 'developer';
  const sent = !!p && liked.includes(p.id);
  return (
    <>
      <div className="topline">
        <h2>
          오늘의 추천<span className="syntax">.</span>
          <i className="focus-caret" aria-hidden="true" />
        </h2>
        {p && (
          <span className="count">
            {String(index + 1).padStart(2, '0')}{' '}
            <span>/ {String(people.length).padStart(2, '0')}</span>
          </span>
        )}
      </div>
      <p className="intro">
        {demo ? '가상의 인물로 화면을 둘러보세요.' : '당신과 맞는 일상의 리듬을 찾아요.'}
        <br />
        하루 세 사람 · 한국 시간 자정에 새로 바뀌어요.
      </p>
      <div className="filter-row">
        {people.map((person, i) => (
          <button
            key={person.id}
            className={`pill ${i === index ? 'active' : ''}`}
            onClick={() => setIndex(i)}
          >
            {person.name}
          </button>
        ))}
        <button
          className="pill filter"
          onClick={() => openSheet({ kind: 'filters' })}
          aria-label="추천 조건 설정"
        >
          조건 <span>⌘</span>
        </button>
      </div>
      {!p ? (
        <Empty
          mark="// waiting"
          title="좋은 만남을 준비하고 있어요"
          action={
            <>
              <button className="btn secondary full" onClick={() => void refresh()}>
                다시 확인하기
              </button>
              <PixelCountdown label="새 추천까지" />
            </>
          }
        >
          {notice || '조건에 맞는 회원이 아직 충분하지 않아요.'}
          <br />
          회원이 모이면 최대 세 사람을 소개해요.
        </Empty>
      ) : (
        <>
          <PersonCard
            person={p}
            reason={reasonFor(p)}
            demo={demo}
            onOpen={() => navigate(`/people/${p.id}`)}
          />
          <div className="mt-[18px] grid grid-cols-[1fr_1.5fr] gap-[10px]">
            <button className="btn secondary" onClick={() => navigate(`/people/${p.id}`)}>
              프로필 보기 <ArrowRight className="ico" aria-hidden="true" />
            </button>
            <LikeButton person={p} />
          </div>
          <div className="likes-left">
            <span>오늘 남은 좋아요</span>
            <PixelHearts remaining={remaining} />
            <b>{Math.max(0, remaining)} / 3</b>
          </div>
          <p className="footnote !mt-1">
            {remaining <= 0 ? '오늘의 좋아요를 모두 사용했어요.' : ''}
            {dev && !sent && remaining > 0 ? 'LGTM!은 마음에 드는 프로필에 보내는 좋아요예요.' : ''}
          </p>
          {remaining <= 0 && <PixelCountdown />}
        </>
      )}
    </>
  );
};
export default TodayPage;
