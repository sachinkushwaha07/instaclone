export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}