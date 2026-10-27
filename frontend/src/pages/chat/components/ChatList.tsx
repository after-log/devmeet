import type { ChatRoom } from '@/types/chats';
import { useState } from 'react';
import { ArrowUpRight, MessageSquare, Search, X } from 'lucide-react';
import type { Person } from '@/types';
import { Avatar } from '@/components/PersonCard';
import { lastActivity } from '@/data/chats';
import ChatListItem from './ChatListItem';
import { FilterTabs } from '@/components/ui/filter-tabs';

const ChatList = ({
  rooms,
  profiles,
  onOpen,
  onDiscover,
}: {
  rooms: ChatRoom[];
  profiles: Person[];
  onOpen: (profileId: string) => void;
  onDiscover: () => void;
}) => {
  const [query, setQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const unreadCount = rooms.filter((room) => room.unread > 0).length;
  const newMatches = rooms.filter((room) => room.messages.length === 0);
  const visibleRooms = rooms
    .filter((room) => {
      const profile = profiles.find((profile) => profile.id === room.profileId);
      return (
        (!unreadOnly || room.unread > 0) &&
        `${profile?.name} ${profile?.job} ${room.messages.at(-1)?.text ?? ''}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      );
    })
    .sort((a, b) => (Date.parse(lastActivity(b)) || 0) - (Date.parse(lastActivity(a)) || 0));

  return (
    <>
      <div className="topline">
        <h2>
          대화<span className="syntax">.</span>
        </h2>
        <span className="count text-green">
          {String(rooms.length).padStart(2, '0')} <span>connections</span>
        </span>
      </div>
      <p className="intro">마음이 통한 사람과, 한 줄씩 가까워져요.</p>
      {newMatches.length > 0 && (
        <section className="chat-matches" aria-labelledby="new-matches-title">
          <div className="flex items-center justify-between gap-2">
            <h3 id="new-matches-title" className="m-0 font-mono text-xs font-normal text-fg-3">
              // new connections
            </h3>
            <span className="text-[11px] text-green">새로운 인연 {newMatches.length}</span>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-1">
            {newMatches.map((room) => {
              const profile = profiles.find((profile) => profile.id === room.profileId)!;
              return (
                <button
                  key={room.profileId}
                  className="group flex shrink-0 flex-col items-center gap-2 rounded-md p-1"
                  onClick={() => onOpen(room.profileId)}
                  aria-label={`${profile.name}님에게 첫 인사 보내기`}
                >
                  <span className="relative">
                    <Avatar person={profile} />
                    <span className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-surface bg-green" />
                  </span>
                  <span className="text-xs text-fg-2">{profile.name}</span>
                </button>
              );
            })}
            <p className="my-auto text-xs leading-[1.9] text-fg-3">
              서로의 마음이 연결됐어요.
              <br />
              <span className="text-fg-4">가벼운 첫 인사를 건네보세요.</span>
            </p>
          </div>
        </section>
      )}
      <div className="chat-search">
        <Search size={16} className="shrink-0 text-fg-4" />
        <input
          aria-label="대화 검색"
          placeholder="이름이나 대화 내용 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button
            className="rounded p-1 text-fg-3"
            onClick={() => setQuery('')}
            aria-label="검색어 지우기"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <FilterTabs
        label="대화 필터"
        options={[
          { value: 'all', label: '전체', count: rooms.length },
          { value: 'unread', label: '안 읽음', count: unreadCount, countTone: 'accent' },
        ]}
        value={unreadOnly ? 'unread' : 'all'}
        onValueChange={(value) => setUnreadOnly(value === 'unread')}
      />
      <div aria-label="대화 목록">
        {visibleRooms.map((room) => (
          <ChatListItem
            key={room.profileId}
            room={room}
            profile={profiles.find((profile) => profile.id === room.profileId)!}
            onOpen={onOpen}
          />
        ))}
      </div>
      {visibleRooms.length === 0 && (
        <div className="empty" role="status">
          <MessageSquare size={30} className="mx-auto mb-6 text-green" />
          <h3>
            {query.trim()
              ? '검색 결과가 없어요'
              : unreadOnly
                ? '모든 대화를 읽었어요'
                : '아직은, 첫 인사 전'}
          </h3>
          <p>
            {query.trim()
              ? '다른 이름이나 대화 내용으로 검색해 보세요.'
              : unreadOnly
                ? '새로운 메시지가 오면 이곳에서 확인해요.'
                : '서로 호감을 보내면 대화를 시작할 수 있어요.'}
          </p>
          {query.trim() || unreadOnly ? (
            <button
              className="btn secondary full"
              onClick={() => {
                setQuery('');
                setUnreadOnly(false);
              }}
            >
              전체 대화 보기
            </button>
          ) : (
            <button className="btn full" onClick={onDiscover}>
              인연 만나러 가기 <ArrowUpRight size={16} className="ml-2 inline" />
            </button>
          )}
        </div>
      )}
      {visibleRooms.length > 0 && (
        <p className="footnote mt-6">// 좋은 대화의 시작은, 작은 관심 하나</p>
      )}
      <p className="footnote">mock 데이터로 구성된 미리보기예요.</p>
    </>
  );
};
export default ChatList;
