export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE';
export type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  age: number;
  region: string;
  joined: string;
  photos: string[];
  reviewPhotos: string[];
  hasProfile: boolean;
  review: ReviewStatus;
  reason: string;
  suspended: boolean;
};
export type Report = {
  id: string;
  sender: string;
  target: string;
  senderId: string;
  targetId: string;
  reason: string;
  detail: string;
  date: string;
  status: 'OPEN' | 'VALID' | 'DISMISSED';
  note: string;
};
export type Question = {
  id: string;
  sectionId: string;
  section: string;
  text: string;
  purpose: string;
  options: string[];
  active: boolean;
};
export type QuestionDraft = Pick<Question, 'section' | 'text' | 'purpose' | 'options'>;
export type Category = { id: string; label: string };
