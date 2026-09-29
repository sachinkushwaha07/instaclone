import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ChatApi } from '../../data-access/chat/chat.api';
import { ChatMessage, Conversation } from '../../data-access/chat/chat.model';
import { WebSocketService } from '../../core/realtime/websocket.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ButtonComponent } from '../../shared/ui/button/button.component';

/**
 * DMs ride the same WebSocketService as live chat and notifications, on a
 * `message` channel. History is fetched once over REST when a thread opens
 * (ChatApi.messages), then new messages arrive over the socket in real time.
 * Optimistic send: a message appears immediately with status 'sending' and
 * flips to 'sent' once the server acks it on the socket.
 */
@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnInit, OnDestroy {
  private readonly chatApi = inject(ChatApi);
  private readonly ws = inject(WebSocketService);
  protected readonly auth = inject(AuthStore);

  protected readonly conversations = signal<Conversation[]>([]);
  protected readonly activeId = signal<string | null>(null);
  protected readonly messages = signal<ChatMessage[]>([]);
  protected draft = '';

  async ngOnInit(): Promise<void> {
    this.conversations.set(await firstValueFrom(this.chatApi.conversations()));
    this.ws.connect('wss://realtime.example.com/chat');
    this.ws.on<ChatMessage>('message').subscribe((msg) => {
      if (msg.conversationId === this.activeId()) {
        this.messages.update((list) => [...list, msg]);
      }
    });
  }

  async openThread(conversationId: string): Promise<void> {
    this.activeId.set(conversationId);
    const page = await firstValueFrom(this.chatApi.messages(conversationId, null));
    this.messages.set(page.items);
  }

  send(): void {
    const conversationId = this.activeId();
    const text = this.draft.trim();
    if (!conversationId || !text) return;

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      conversationId,
      senderId: this.auth.user()?.id ?? '',
      text,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };
    this.messages.update((list) => [...list, optimistic]);
    this.ws.send({ type: 'message', payload: { conversationId, text, clientId: optimistic.id } });
    this.draft = '';
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }
}
