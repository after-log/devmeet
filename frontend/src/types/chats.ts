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
