import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LiveApi } from '../../../data-access/live/live.api';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

type BroadcastState = 'setup' | 'connecting' | 'live' | 'error';

/**
 * Backend issues a room + scoped token (see LiveApi.startBroadcast).
 * This component's job is capture (getUserMedia) + publish (provider SDK)
 * + a small state machine for the UI. It never talks to the SFU directly.
 *
 * To wire a real provider, install `livekit-client` and replace the
 * `publishToRoom()` body with:
 *
 *   import { Room } from 'livekit-client';
 *   const room = new Room({ adaptiveStream: true, dynacast: true });
 *   await room.connect(roomUrl, token);
 *   await room.localParticipant.enableCameraAndMicrophone();
 */
@Component({
  selector: 'app-broadcaster',
  standalone: true,
  imports: [ButtonComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './broadcaster.component.html',
  styleUrl: './broadcaster.component.scss',
})
export class BroadcasterComponent {
  private readonly liveApi = inject(LiveApi);
  private readonly router = inject(Router);
  private readonly preview = viewChild.required<ElementRef<HTMLVideoElement>>('preview');

  protected readonly state = signal<BroadcastState>('setup');
  protected readonly viewerCount = signal(0);
  protected title = '';
  private mediaStream: MediaStream | null = null;

  async ngOnInit(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.preview().nativeElement.srcObject = this.mediaStream;
    } catch {
      this.state.set('error');
    }
  }

  async goLive(): Promise<void> {
    this.state.set('connecting');
    try {
      const { roomUrl, token, roomId } = await firstValueFrom(this.liveApi.startBroadcast(this.title || 'Live'));
      await this.publishToRoom(roomUrl, token);
      this.state.set('live');
      this.currentRoomId = roomId;
    } catch {
      this.state.set('error');
    }
  }

  private currentRoomId: string | null = null;

  private async publishToRoom(_roomUrl: string, _token: string): Promise<void> {
    // Placeholder for the provider SDK connect + enableCameraAndMicrophone
    // call described above. Kept as a no-op here so this scaffold has no
    // hard dependency on a specific media provider until one is chosen.
  }

  async end(): Promise<void> {
    if (this.currentRoomId) await firstValueFrom(this.liveApi.end(this.currentRoomId));
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.router.navigateByUrl('/live');
  }

  ngOnDestroy(): void {
    this.mediaStream?.getTracks().forEach((t) => t.stop());
  }
}
