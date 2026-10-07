export type Role = 'dev' | 'other';
export type Preference = 'all' | Role;
export type Verification = '' | 'ing' | 'ok';
export interface Profile {
  name: string;
  age: number;
  job: string;
  place: string;
  initial: string;
  afterWork: string;
  score: number;
  tags: string[];
  bio: string;
  reason: string;
}
export interface SignupProfile {
  role: Role | '';
  nick: string;
  email: Verification;
  github: Verification;
  pref: Preference | '';
  rel: string;
  time: string;
  ans: (boolean | null)[];
}
export const emptyProfile = (): SignupProfile => ({
  role: '',
  nick: '',
  email: '',
  github: '',
  pref: '',
  rel: '진지한 관계를 원해요',
  time: '평일 저녁',
  ans: [],
});
