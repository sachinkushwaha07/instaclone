import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatMessage, Conversation } from './chat.model';
import { Page } from '../page.model';

@Injectable({ providedIn: 'root' })
export class ChatApi {
  private readonly http = inject(HttpClient);

  conversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>('/api/conversations');
  }

  messages(conversationId: string, cursor: string | null): Observable<Page<ChatMessage>> {
    return this.http.get<Page<ChatMessage>>(`/api/conversations/${conversationId}/messages`, {
      params: cursor ? { cursor } : {},
    });
  }

  // Sending itself happens over the WebSocket (see WebSocketService) for
  // low latency; this REST call is only the history fetch on thread open.
}