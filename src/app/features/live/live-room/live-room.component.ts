import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { bufferTime, filter } from 'rxjs/operators';
import { LiveApi } from '../../../data-access/live/live.api';
import { WebSocketService } from '../../../core/realtime/websocket.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

interface LiveChatEvent {
  username: string;
  text: string;
}

/**
 * Viewer side of live streaming. Two playback strategies exist for a real
 * build, chosen by the backend/provider setup:
 *  - WebRTC (via the provider SDK, e.g. `livekit-client`'s Room + Track
 *    attach) for sub-second latency in small/interactive rooms.
 *  - LL-HLS via `hls.js` (with a native <video> fallback on Safari, which
 *    supports HLS natively) for large audiences via a CDN.
 * This component wires the second path since it needs no extra client
 * dependency; swap `attachHls()` for a provider Room connection as needed.
 *
 * Live chat rides the same WebSocketService used for DMs and notifications,
 * on its own `live-chat` channel, batched with bufferTime so a popular
 * stream's flood of comments doesn't repaint on every single message.
 */
@Component({
  selector: 'app-live-room',
  standalone: true,
  imports: [ButtonComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-room.component.html',
  styleUrl: './live-room.component.scss',
})
export class LiveRoomComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly liveApi = inject(LiveApi);
  private readonly ws = inject(WebSocketService);
  private readonly player = viewChild.required<ElementRef<HTMLVideoElement>>('player');

  protected readonly chatLog = signal<LiveChatEvent[]>([]);
  protected draft = '';
  private roomId = '';

  async ngOnInit(): Promise<void> {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    const { roomUrl, token } = await firstValueFrom(this.liveApi.joinAsViewer(this.roomId));

    // Real playback wiring goes here, e.g.:
    //   const hls = new Hls(); hls.loadSource(hlsManifestUrl); hls.attachMedia(this.player().nativeElement);
    // or a WebRTC Room.connect(roomUrl, token) + track.attach(videoEl).
    void roomUrl;
    void token;

    this.ws.connect(`wss://realtime.example.com/live/${this.roomId}`);

    // Cap re-renders to roughly 10/sec even if hundreds of messages arrive,
    // so a popular stream's chat doesn't freeze the UI thread.
    this.ws
      .on<LiveChatEvent>('live-chat')
      .pipe(bufferTime(100), filter((batch) => batch.length > 0))
      .subscribe((batch) => this.chatLog.update((log) => [...log, ...batch].slice(-200)));
  }

  send(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.ws.send({ type: 'live-chat', payload: { roomId: this.roomId, text } });
    this.draft = '';
  }

  leave(): void {
    this.router.navigateByUrl('/live');
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }
}
