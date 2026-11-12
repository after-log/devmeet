import sections from '@/data/value-questions.json';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  age: number;
  region: string;
  joined: string;
  photos: string[];
  review: ReviewStatus;
  reason: string;
  suspended: boolean;
};
const portraits = [
  '1494790108377-be9c29b29330',
  '1507003211169-0a1dd7228f2d',
  '1534528741775-53994a69daeb',
  '1500648767791-00dcc994a43e',
  '1438761681033-6461ffad8d80',
  '1506794778202-cad84cf45f1d',
  '1544005313-94ddf0286df2',
  '1519085360753-af0119f7cbe7',
  '1517841905240-472988babdf9',
  '1539571696357-5a69c17a67c6',
  '1524504388940-b1c1722653e1',
  '1567532939604-b6b5b0db2604',
];
export const initialMembers: Member[] = [
  '김서연',
  '이민준',
  '박지우',
  '최도윤',
  '정하은',
  '강지훈',
  '윤수아',
  '장현우',
  '임민서',
  '한건우',
  '오예린',
  '서준호',
].map((name, i) => ({
  id: `DM-${String(1024 + i).padStart(5, '0')}`,
  name,
  email: `member${i + 1}@example.com`,
  role: i % 3 === 2 ? '디자이너' : i % 2 ? '백엔드 개발자' : '프론트엔드 개발자',
  age: 26 + (i % 7),
  region: ['서울 강남구', '서울 마포구', '경기 성남시'][i % 3],
  joined: `2026.11.${String(12 - Math.floor(i / 2)).padStart(2, '0')}`,
  photos: [0, 1, 2].map(
    (n) =>
      `https://images.unsplash.com/photo-${portraits[i]}?w=700&q=80&auto=format&fit=crop&crop=faces&variant=${n}`,
  ),
  review: i < 6 ? 'PENDING' : i < 10 ? 'APPROVED' : 'REJECTED',
  reason: i >= 10 ? '얼굴을 확인할 수 있는 사진으로 다시 등록해 주세요.' : '',
  suspended: i === 11,
}));
export type Report = {
  id: string;
  sender: string;
  target: string;
  reason: string;
  detail: string;
  date: string;
  status: 'OPEN' | 'VALID' | 'DISMISSED';
  note: string;
};
export const initialReports: Report[] = [
  {
    id: 'RP-0042',
    sender: '김서연',
    target: '서준호',
    reason: '부적절한 메시지',
    detail: '대화 중 반복적으로 불쾌한 표현을 사용했습니다. 대화 내용을 확인해 주세요.',
    date: '2026.11.12 14:32',
    status: 'OPEN',
    note: '',
  },
  {
    id: 'RP-0041',
    sender: '박지우',
    target: '장현우',
    reason: '프로필 정보 불일치',
    detail: '프로필에 기재된 나이와 대화에서 이야기한 나이가 다릅니다.',
    date: '2026.11.12 11:08',
    status: 'OPEN',
    note: '',
  },
  {
    id: 'RP-0040',
    sender: '정하은',
    target: '이민준',
    reason: '광고 및 홍보',
    detail: '외부 서비스 가입 링크를 여러 번 보냈습니다.',
    date: '2026.11.11 18:45',
    status: 'OPEN',
    note: '',
  },
  {
    id: 'RP-0039',
    sender: '윤수아',
    target: '최도윤',
    reason: '부적절한 메시지',
    detail: '메시지 내용 검토 요청입니다.',
    date: '2026.11.10 09:21',
    status: 'VALID',
    note: '신고 내용을 확인하고 경고 처리했습니다.',
  },
  {
    id: 'RP-0038',
    sender: '임민서',
    target: '강지훈',
    reason: '기타',
    detail: '프로필 확인을 요청합니다.',
    date: '2026.11.09 16:10',
    status: 'DISMISSED',
    note: '정책 위반 사항이 확인되지 않았습니다.',
  },
];
export type Question = {
  id: string;
  section: string;
  text: string;
  purpose: string;
  options: string[];
  active: boolean;
};
export const categories = sections.map(({ id, label }) => ({ id, label }));
export const initialQuestions: Question[] = sections.flatMap((section) =>
  section.questions.map((q) => ({ ...q, section: section.label, active: true })),
);
