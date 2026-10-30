// 화면과 서버 API가 함께 쓰는 타입.
export type Role = 'developer' | 'non-developer';

export interface ValueAnswer {
  choice: string | null;
  private: boolean;
}
export type ValueAnswers = Record<string, ValueAnswer>;

export interface Profile {
  valueAnswers?: ValueAnswers;
  name: string;
  age: number;
  height: number;
  location: string; // "서울시 서초구" 형식
  job: string;
  education: string;
  role: Role;
  meeting: string;
  contact: string;
  preference: string; // 상관없어요 | 개발자 | 비개발자
  smoking: string;
  drinking: string;
  religion: string;
  intro: string;
  tags: string[];
  photo: string;
  minAge: number;
  maxAge: number;
  region: string; // 추천 조건. 비우면 전체
}

/** 다른 회원에게 공개되는 정보 */
export interface Person {
  githubVerified?: boolean;
  valueAnswers?: ValueAnswers;
  photoStatus?: string;
  id: string;
  name: string;
  age: number;
  height: number;
  location: string;
  job: string;
  education: string;
  role: Role;
  meeting: string;
  contact: string;
  smoking: string;
  drinking: string;
  religion: string;
  intro: string;
  tags: string[];
  photo: string;
}

export interface User {
  admin?: boolean;
  verification?: {
    email?: boolean;
    github: boolean;
    photoStatus: string;
    photoReviewReason: string;
  };
  id: string;
  email: string;
  profile: Profile | null;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  created: number;
}

export interface Recommendations {
  notice?: string;
  people: Person[];
  liked: string[];
  remaining: number;
  day: string;
}

export interface Connections {
  sent: Person[];
  received: Person[];
  matches: Person[];
}

/** 가입 단계에서 쌓는 값. 저장 시 Profile로 정리한다. */
export type Draft = Partial<Profile> & { city?: string; district?: string; tagsText?: string };
