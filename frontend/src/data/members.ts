// 가입 없이 둘러보기 전용 가상 회원. 실제 계정 추천에는 사용하지 않는다.
// likesYou가 true인 회원은 내가 좋아요를 보내면 바로 매칭되고, '받은 좋아요'에도 보인다.
import type { Person, Role } from '@/types';

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop&crop=faces`;
export const demoProfilePhoto = photo('1535713875002-d1d0cf377fde');
const W = [
  '1494790108377-be9c29b29330',
  '1534528741775-53994a69daeb',
  '1438761681033-6461ffad8d80',
  '1544005313-94ddf0286df2',
  '1517841905240-472988babdf9',
  '1524504388940-b1c1722653e1',
  '1488426862026-3ee34a7d66df',
  '1529626455594-4ff0802cfb7e',
  '1580489944761-15a19d654956',
  '1487412720507-e7ab37603c6f',
  '1499952127939-9bbf5af6c51c',
  '1546961329-78bef0414d7c',
];
const M = [
  '1507003211169-0a1dd7228f2d',
  '1500648767791-00dcc994a43e',
  '1506794778202-cad84cf45f1d',
  '1519085360753-af0119f7cbe7',
  '1539571696357-5a69c17a67c6',
  '1567532939604-b6b5b0db2604',
  '1492562080023-ab3db95bfbce',
  '1500048993953-d23a436266cf',
  '1521119989659-a83eee488004',
  '1506277886164-e25aa3f4ef7f',
  '1535713875002-d1d0cf377fde',
  '1570295999919-56ceb5ecca61',
];
const wNames = [
  '서연',
  '지우',
  '하은',
  '수아',
  '민서',
  '예린',
  '다인',
  '채원',
  '윤아',
  '소희',
  '지현',
  '나연',
];
const mNames = [
  '민준',
  '도윤',
  '지훈',
  '현우',
  '건우',
  '준서',
  '태윤',
  '시우',
  '은호',
  '재민',
  '승현',
  '우진',
];
const areas = [
  '서울시 마포구',
  '서울시 성동구',
  '서울시 강남구',
  '서울시 서초구',
  '서울시 용산구',
  '서울시 송파구',
  '서울시 관악구',
  '서울시 영등포구',
  '경기도 성남시',
  '경기도 수원시',
  '경기도 고양시',
  '경기도 용인시',
];
const devJobs = [
  '프론트엔드 개발자',
  '백엔드 개발자',
  'iOS 개발자',
  '안드로이드 개발자',
  '데이터 엔지니어',
  'DevOps 엔지니어',
  '머신러닝 엔지니어',
  '풀스택 개발자',
];
const nonJobs = [
  '프로덕트 디자이너',
  '서비스 기획자',
  '마케터',
  '콘텐츠 에디터',
  '간호사',
  '초등학교 교사',
  '회계사',
  '연구원',
];
const intros = [
  '퇴근 후에는 동네를 한 바퀴 걷고, 주말엔 새로 생긴 카페를 찾아다녀요. 서로의 하루를 편하게 나눌 사람을 만나고 싶어요.',
  '평일엔 일에 집중하고 주말엔 러닝을 해요. 같이 장 보고 요리하는 걸 좋아할 사람이면 좋겠어요.',
  '조용한 전시와 오래된 서점을 좋아해요. 천천히 알아가는 만남이 편해요.',
  '맛있는 저녁은 제가 만들게요. 대화가 잘 통하면 말이 길어지는 편이에요.',
  '여행 계획 세우는 걸 좋아해요. 가까운 곳이라도 같이 떠날 수 있는 사람이면 좋겠어요.',
  '영화 보고 나서 이야기 나누는 시간을 좋아해요. 다정하고 솔직한 관계를 바라요.',
];
const tagSets = [
  ['카페투어', '산책', '전시'],
  ['러닝', '요리', '독서'],
  ['영화', '재즈', '와인'],
  ['등산', '캠핑', '사진'],
  ['보드게임', '맛집', '여행'],
  ['요가', '독립서점', '집밥'],
];
const pick = <T>(list: T[], i: number) => list[i % list.length];

export interface Member extends Person {
  likesYou: boolean;
  joined: number; // 정렬용. 숫자가 클수록 최근 가입
}

const make = (gender: 'f' | 'm', i: number): Member => {
  const dev = i % 3 !== 2; // 셋 중 둘은 개발자. 비개발자 회원도 추천을 받을 수 있게
  const shift = gender === 'f' ? 0 : 5;
  return {
    id: `${gender}${String(i + 1).padStart(2, '0')}`,
    name: (gender === 'f' ? wNames : mNames)[i],
    age: 25 + ((i * 3 + (gender === 'f' ? 1 : 2)) % 13),
    height: gender === 'f' ? 158 + ((i * 2) % 12) : 170 + ((i * 3) % 14),
    location: pick(areas, i + shift),
    job: dev ? pick(devJobs, i) : pick(nonJobs, i),
    education: pick(['대학교 졸업', '대학교 졸업', '대학원 졸업', '전문대학교 졸업'], i),
    role: (dev ? 'developer' : 'non-developer') as Role,
    meeting: pick(['주말에 1–2번', '주 2–3번', '상황에 맞춰 유연하게'], i),
    contact: pick(['틈틈이 자주', '바쁜 날에도 짧은 안부', '할 말이 있을 때 편하게'], i + 1),
    smoking: i % 6 === 5 ? '흡연' : '비흡연',
    drinking: pick(['마시지 않아요', '거의 안 마셔요', '가끔', '주 1–2회', '주 3회 이상'], i),
    religion: pick(['무교', '무교', '기독교', '천주교', '불교'], i),
    intro: pick(intros, i + (gender === 'f' ? 0 : 3)),
    tags: pick(tagSets, i + (gender === 'f' ? 1 : 4)),
    photo: photo((gender === 'f' ? W : M)[i]),
    likesYou: i % 4 === 0,
    joined: 100 - (i * 2 + (gender === 'f' ? 0 : 1)),
  };
};

export const members: Member[] = [
  ...W.map((_, i) => make('f', i)),
  ...M.map((_, i) => make('m', i)),
];

/** 화면 둘러보기용 가상 인물 3명 */
export const demoPeople: Person[] = [members[1], members[13], members[6]].map(
  ({ likesYou: _l, joined: _j, ...p }) => p,
);
