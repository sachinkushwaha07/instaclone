import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ChatApi } from '../../data-access/chat/chat.api';
import { ChatMessage, Conversation } from '../../data-access/chat/chat.model';
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
export class MessagesComponent implements OnInit {
  private readonly chatApi = inject(ChatApi);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthStore);

  protected readonly conversations = signal<Conversation[]>([]);
  protected readonly activeId = signal<string | null>(null);
  protected readonly messages = signal<ChatMessage[]>([]);
  protected draft = '';

  async ngOnInit(): Promise<void> {
    this.conversations.set(await firstValueFrom(this.chatApi.conversations()));
    const recipient = this.route.snapshot.queryParamMap.get('recipient');
    if (recipient) {
      const conversation = await firstValueFrom(this.chatApi.createConversation(recipient));
      if (!this.conversations().some((item) => item.id === conversation.id)) {
        this.conversations.update((items) => [conversation, ...items]);
      }
      await this.openThread(conversation.id);
    }
  }

  async openThread(conversationId: string): Promise<void> {
    this.activeId.set(conversationId);
    this.messages.set(await firstValueFrom(this.chatApi.messages(conversationId)));
  }

  async send(): Promise<void> {
    const conversationId = this.activeId();
    const text = this.draft.trim();
    if (!conversationId || !text) return;

    const message = await firstValueFrom(this.chatApi.send(conversationId, text));
    this.messages.update((list) => [...list, message]);
    this.draft = '';
  }
}
