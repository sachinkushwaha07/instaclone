import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatMessage, Conversation } from './chat.model';

@Injectable({ providedIn: 'root' })
export class ChatApi {
  private readonly http = inject(HttpClient);

  conversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>('/api/conversations');
  }

  messages(conversationId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`/api/conversations/${conversationId}/messages`);
  }

  createConversation(participantId: string): Observable<Conversation> {
    return this.http.post<Conversation>('/api/conversations', { participantId });
  }

  send(conversationId: string, text: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`/api/conversations/${conversationId}/messages`, { text });
  }

}
