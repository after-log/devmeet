import type { ChatRoom } from '@/types/chats';

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
export const lastActivity = (room: ChatRoom) => room.messages.at(-1)?.sentAt ?? '';
