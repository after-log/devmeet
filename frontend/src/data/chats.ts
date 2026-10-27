export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  sentAt: string;
}

export interface ChatRoom {
  profileId: string;
  matchedAt: string;
  interests: string[];
  starter: string;
  unread: number;
  messages: ChatMessage[];
}

const at = (daysAgo: number, hour: number, minute: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const mockChats: ChatRoom[] = [
  {
    profileId: 'MJ',
    matchedAt: at(1, 18, 0),
    interests: ['카페 탐방', '평일 저녁', '진지한 관계'],
    starter: '요즘 가장 좋았던 카페가 있나요?',
    unread: 2,
    messages: [
      {
        id: 'mj-1',
        sender: 'them',
        text: '안녕하세요! 프로필에 카페 탐방 좋아하신다고 해서 반가웠어요 ☕',
        sentAt: at(1, 18, 12),
      },
      {
        id: 'mj-2',
        sender: 'me',
        text: '안녕하세요 :) 저도 반가워요. 주말마다 새로운 카페 찾아가는 게 취미예요!',
        sentAt: at(1, 18, 15),
      },
      {
        id: 'mj-3',
        sender: 'them',
        text: '저도요! 커피도 좋지만 공간 구경하는 재미가 있더라고요.',
        sentAt: at(1, 18, 17),
      },
      {
        id: 'mj-4',
        sender: 'them',
        text: '성수에 조용한 카페를 발견했는데, 다음에 같이 가볼래요?',
        sentAt: at(1, 18, 18),
      },
    ],
  },
  {
    profileId: 'SY',
    matchedAt: at(2, 18, 0),
    interests: ['전시 산책', '새로운 공간', '함께하는 시간'],
    starter: '최근에 기억에 남는 전시가 있나요?',
    unread: 1,
    messages: [
      {
        id: 'sy-1',
        sender: 'me',
        text: '안녕하세요! 전시 산책이라는 취미가 멋져요.',
        sentAt: at(2, 19, 5),
      },
      {
        id: 'sy-2',
        sender: 'them',
        text: '반가워요! 이번 주말에 보고 싶은 전시가 있는데 추천해 드릴까요?',
        sentAt: at(2, 19, 20),
      },
    ],
  },
  {
    profileId: 'HE',
    matchedAt: at(3, 18, 0),
    interests: ['독립서점', '영화', '취향 나누기'],
    starter: '요즘 읽고 있는 책이 있나요?',
    unread: 0,
    messages: [
      {
        id: 'he-1',
        sender: 'them',
        text: '안녕하세요 :) 서로의 취향을 천천히 알아가면 좋겠어요.',
        sentAt: at(3, 20, 0),
      },
      {
        id: 'he-2',
        sender: 'me',
        text: '좋아요! 저는 요즘 독립서점 구경에 빠졌어요. 좋아하는 서점 있으세요?',
        sentAt: at(3, 20, 8),
      },
    ],
  },
  {
    profileId: 'JH',
    matchedAt: at(1, 18, 0),
    interests: ['커피', '주말 러닝', '꾸준한 일상'],
    starter: '주말에 주로 어디에서 러닝하세요?',
    unread: 0,
    messages: [],
  },
];

export const chatDate = (value: string) =>
  new Date(value).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
export const chatTime = (value: string) =>
  new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
export const chatPreviewTime = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return chatTime(value);
  today.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return '어제';
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
};
export const lastActivity = (room: ChatRoom) => room.messages.at(-1)?.sentAt ?? room.matchedAt;
