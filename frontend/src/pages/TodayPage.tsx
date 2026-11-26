import { ArrowRight } from 'lucide-react';
import { useLayoutEffect, useRef, type UIEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { reasonFor, useApp } from '../stores/app';
import PersonCard, { Empty } from '@/components/PersonCard';
import LikeButton from '@/components/LikeButton';
import PixelCountdown from '@/components/pixel/PixelCountdown';
import PixelHearts from '@/components/pixel/PixelHearts';
import PageScene from '@/components/pixel/PageScene';
import { prefersReducedMotion } from '@/lib/pixel';

const cardStride = (scroller: HTMLDivElement, count: number) =>
  count > 1 ? (scroller.scrollWidth - scroller.clientWidth) / (count - 1) : 0;

const TodayPage = () => {
  const navigate = useNavigate();
  const { people, index, setIndex, remaining, demo, openSheet, refresh, notice } = useApp();
  const p = people[index];
  const carousel = useRef<HTMLDivElement>(null);
  const count = people.length;

  useLayoutEffect(() => {
    const scroller = carousel.current;
    if (scroller) scroller.scrollLeft = useApp.getState().index * cardStride(scroller, count);
  }, [count]);

  const updateIndex = ({ currentTarget }: UIEvent<HTMLDivElement>) => {
    const stride = cardStride(currentTarget, count);
    if (!stride) return;
    const next = Math.max(0, Math.min(count - 1, Math.round(currentTarget.scrollLeft / stride)));
    if (next !== useApp.getState().index) setIndex(next);
  };

  const showCard = (targetIndex: number) => {
    const scroller = carousel.current;
    if (!scroller) return;
    scroller.scrollTo({
      left: targetIndex * cardStride(scroller, count),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  return (
    <>
      <div className="topline">
        <h2>
          오늘의 추천<span className="syntax">.</span>
          <i className="focus-caret" aria-hidden="true" />
        </h2>
        {p && (
          <span className="count" aria-live="polite">
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
      <PageScene name="discover" />
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {count > 1 && (
          <div
            className="col-start-2 row-start-1 flex items-center"
            role="group"
            aria-label="추천 카드 이동"
          >
            {people.map((person, i) => (
              <button
                key={person.id}
                type="button"
                className="group grid size-8 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-point"
                aria-label={`${i + 1}번째 추천 보기`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => showCard(i)}
              >
                <span
                  className="size-2 rounded-full border border-fg-3 group-hover:border-point group-aria-current:border-point group-aria-current:bg-point"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="pill col-start-3 row-start-1 filter"
          onClick={() => openSheet({ kind: 'filters' })}
          aria-label="추천 조건 설정"
        >
          조건 <span aria-hidden="true">⌘</span>
        </button>
      </div>
      {!p ? (
        <Empty
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
          <div
            ref={carousel}
            className="grid snap-x snap-mandatory scrollbar-none auto-cols-[100%] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-point [&::-webkit-scrollbar]:hidden"
            role="region"
            aria-label="오늘의 추천 프로필"
            tabIndex={count > 1 ? 0 : undefined}
            onScroll={updateIndex}
          >
            {people.map((person) => (
              <div className="min-w-0 snap-start" key={person.id}>
                <PersonCard
                  person={person}
                  reason={reasonFor(person)}
                  demo={demo}
                  onOpen={() => navigate(`/people/${person.id}`)}
                />
                <div className="mt-4.5 grid grid-cols-[1fr_1.5fr] gap-2.5">
                  <button
                    className="btn secondary"
                    onClick={() => navigate(`/people/${person.id}`)}
                  >
                    프로필 보기 <ArrowRight className="ico" aria-hidden="true" />
                  </button>
                  <LikeButton person={person} />
                </div>
              </div>
            ))}
          </div>
          <div className="likes-left">
            <span>오늘 남은 좋아요</span>
            <PixelHearts remaining={remaining} />
            <b>{Math.max(0, remaining)} / 3</b>
          </div>
          <p className="footnote mt-1!">
            {remaining <= 0 ? '오늘의 좋아요를 모두 사용했어요.' : ''}
          </p>
          {remaining <= 0 && <PixelCountdown />}
        </>
      )}
    </>
  );
};
export default TodayPage;
