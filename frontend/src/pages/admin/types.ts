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

export type AdminStatistics = {
  updatedAt: string;
  totalMembers: number;
  chatParticipants: number;
  daily: {
    date: string;
    signups: number;
    likes: number;
    matches: number;
    messages: number;
    chatParticipants: number;
  }[];
};

export type MatchingPreset = {
  id: string;
  seriesId: string;
  version: number;
  name: string;
  description: string;
  valuesWeight: number;
  meetingWeight: number;
  contactWeight: number;
  legacyScoring: boolean;
  createdAt: string;
  deletedAt: string | null;
};
export type MatchingPresetDraft = {
  baseId: string | null;
  name: string;
  description: string;
  valuesWeight: number;
  meetingWeight: number;
  contactWeight: number;
};
export type MatchingSettings = {
  activeId: string;
  updatedAt: string;
  presets: MatchingPreset[];
  performance: {
    presetId: string;
    recommendations: number;
    members: number;
    likes: number;
    matches: number;
  }[];
};
