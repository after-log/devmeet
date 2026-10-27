import { useState } from 'react';
import { ArrowUpRight, Heart } from 'lucide-react';
import type { Person } from '@/types';
import type { LikeDirection, LikeEntry } from '@/types/likes';
import LikeListItem from './LikeListItem';
import { FilterTabs } from '@/components/ui/filter-tabs';

interface LikesProps {
  entries: LikeEntry[];
  profiles: Person[];
  matchedIds: string[];
  onOpen: (profileId: string) => void;
  onDiscover: () => void;
}

const Likes = ({ entries, profiles, matchedIds, onOpen, onDiscover }: LikesProps) => {
  const [direction, setDirection] = useState<LikeDirection>('received');
  const [matchedOnly, setMatchedOnly] = useState(false);
  const received = entries.filter((entry) => entry.direction === 'received');
  const sent = entries.filter((entry) => entry.direction === 'sent');
  const visible = (direction === 'received' ? received : sent).filter(
    (entry) => !matchedOnly || matchedIds.includes(entry.profileId),
  );

  return (
    <>
      <div className="topline">
        <h2>
          호감<span className="syntax">.</span>
        </h2>
        <span className="count text-purple">
          {String(entries.length).padStart(2, '0')} <span>likes</span>
        </span>
      </div>
      <p className="intro">작은 관심이 모여, 새로운 인연이 시작돼요.</p>
      <section
        className="mb-6 rounded-[9px] border border-border bg-surface p-4"
        aria-label="호감 안내"
      >
        <p className="section-comment">// a little courage, a new connection</p>
        <div className="flex items-start gap-3">
          <Heart size={20} className="mt-1 shrink-0 text-purple" />
          <p className="m-0 text-xs leading-[1.9] text-fg-2">
            나를 궁금해하는 사람이 있어요.
            <br />
            <span className="text-fg-4">서로 호감을 보내면 둘만의 대화가 열려요.</span>
          </p>
        </div>
      </section>
      <FilterTabs<LikeDirection>
        label="호감 목록 구분"
        options={[
          { value: 'received', label: '받은 호감', count: received.length },
          { value: 'sent', label: '보낸 호감', count: sent.length },
        ]}
        value={direction}
        onValueChange={setDirection}
      />
      <div className="flex items-center justify-between py-4 text-[11px]">
        <span className="text-fg-4">{visible.length}명의 인연</span>
        <label className="flex cursor-pointer items-center gap-2 text-fg-3">
          <input
            type="checkbox"
            className="size-3.5 min-h-0 w-auto accent-blue"
            checked={matchedOnly}
            onChange={(event) => setMatchedOnly(event.target.checked)}
          />
          서로 호감만 보기
        </label>
      </div>
      <div aria-label={direction === 'received' ? '받은 호감 목록' : '보낸 호감 목록'}>
        {visible.map((entry) => {
          const profile = profiles.find((profile) => profile.id === entry.profileId);
          return profile ? (
            <LikeListItem
              key={`${entry.direction}-${entry.profileId}`}
              entry={entry}
              profile={profile}
              matched={matchedIds.includes(entry.profileId)}
              onOpen={onOpen}
            />
          ) : null;
        })}
      </div>
      {visible.length === 0 ? (
        <div className="empty" role="status">
          <Heart size={30} className="mx-auto mb-6 text-purple" />
          <h3>
            {matchedOnly
              ? '아직은, 마음이 닿기 전'
              : direction === 'received'
                ? '새로운 인연을 기다리고 있어요'
                : '작은 용기로 시작해요'}
          </h3>
          <p>
            {matchedOnly
              ? '서로 호감을 보낸 인연을 여기서 확인해요.'
              : direction === 'received'
                ? '나에게 도착한 호감을 이곳에 모아둘게요.'
                : '마음이 가는 사람에게 호감을 보내보세요.'}
          </p>
          {matchedOnly ? (
            <button className="btn secondary full" onClick={() => setMatchedOnly(false)}>
              모든 호감 보기
            </button>
          ) : (
            <button className="btn full" onClick={onDiscover}>
              오늘의 인연 만나기 <ArrowUpRight size={15} className="ml-2 inline" />
            </button>
          )}
        </div>
      ) : (
        <p className="footnote mt-6">// 마음에 드는 인연을 눌러 더 알아보세요</p>
      )}
      <p className="footnote">mock 데이터로 구성된 미리보기예요.</p>
    </>
  );
};
export default Likes;
