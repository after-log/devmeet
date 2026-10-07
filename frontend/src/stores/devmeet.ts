import { create } from 'zustand';
import { toast } from 'sonner';
import type { Preference, SignupProfile } from '../types';
import { emptyProfile } from '../types';
import { profiles } from '../data/profiles';
import { savedProfile } from '../lib/profile-storage';
import { savedSession, saveSession } from '../lib/session-storage';

export type DialogKind = 'match' | 'filters' | 'safety' | null;
type Update<T> = T | ((previous: T) => T);
export interface DevmeetState {
  profile: SignupProfile;
  step: number;
  index: number;
  filter: Preference;
  likes: string[];
  matched: boolean;
  messages: string[];
  modal: DialogKind;
  draftFilter: Preference;
  setProfile: (value: Update<SignupProfile>) => void;
  setStep: (value: number) => void;
  setIndex: (value: Update<number>) => void;
  setFilter: (value: Preference) => void;
  setMatched: (value: boolean) => void;
  setMessages: (value: Update<string[]>) => void;
  setModal: (value: DialogKind) => void;
  setDraftFilter: (value: Preference) => void;
  replay: () => void;
  jump: (step: number) => void;
  enter: () => void;
  like: () => void;
  settings: () => void;
}
export const selectProfiles = (filter: Preference) =>
  profiles.filter(
    (p) =>
      filter === 'all' ||
      (filter === 'dev' ? /개발|엔지니어/.test(p.job) : !/개발|엔지니어/.test(p.job)),
  );
const initialProfile = savedProfile();
export const useDevmeetStore = create<DevmeetState>()((set, get) => ({
  profile: initialProfile,
  step: 0,
  index: 0,
  filter: initialProfile.pref || 'all',
  ...savedSession(),
  modal: null,
  draftFilter: 'all',
  setProfile: (value) =>
    set((s) => ({ profile: typeof value === 'function' ? value(s.profile) : value })),
  setStep: (step) => set({ step }),
  setIndex: (value) =>
    set((s) => ({ index: typeof value === 'function' ? value(s.index) : value })),
  setFilter: (filter) => set({ filter }),
  setMatched: (matched) => set({ matched }),
  setMessages: (value) =>
    set((s) => ({ messages: typeof value === 'function' ? value(s.messages) : value })),
  setModal: (modal) => set({ modal }),
  setDraftFilter: (draftFilter) => set({ draftFilter }),
  replay: () => set({ profile: emptyProfile(), step: 0 }),
  jump: (step) =>
    set((s) => ({
      step,
      profile: {
        ...s.profile,
        role: s.profile.role || 'dev',
        pref: s.profile.pref || 'all',
        nick: s.profile.nick || '나',
        ...(step === 3 ? { ans: [] } : {}),
      },
    })),
  enter: () => {
    const previous = get().profile;
    const profile = {
      ...previous,
      role: previous.role || 'dev',
      pref: previous.pref || 'all',
    } satisfies SignupProfile;
    set({ profile, filter: profile.pref, index: 0 });
    try {
      localStorage.setItem('devmeet.onboarded', '1');
      localStorage.setItem('devmeet.profile', JSON.stringify(profile));
    } catch {
      /* 메모리 상태로 계속 진행 */
    }
    toast(
      profile.nick
        ? `${profile.nick}님을 위한 오늘의 추천이 준비됐어요`
        : '오늘의 추천이 준비됐어요',
    );
  },
  like: () => {
    const { filter, index, likes } = get();
    const current = selectProfiles(filter)[index];
    if (!current) return;
    if (likes.includes(current.initial)) {
      toast('이미 호감을 보낸 프로필이에요');
      return;
    }
    set({
      likes: [...likes, current.initial],
      ...(current.initial === 'MJ'
        ? { matched: true, modal: 'match' as const }
        : { index: index + 1 }),
    });
    if (current.initial !== 'MJ') toast('호감을 보냈어요');
  },
  settings: () => set({ draftFilter: get().filter, modal: 'filters' }),
}));

// Persist only session data; routes and temporary UI state stay independent.
useDevmeetStore.subscribe((state, previous) => {
  if (
    state.likes !== previous.likes ||
    state.matched !== previous.matched ||
    state.messages !== previous.messages
  ) {
    saveSession({ likes: state.likes, matched: state.matched, messages: state.messages });
  }
});
