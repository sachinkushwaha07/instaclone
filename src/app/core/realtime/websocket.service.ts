import { Injectable, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export type SocketStatus = 'connecting' | 'open' | 'closed' | 'reconnecting';

/** Every message on the wire is tagged with a `type`, so features can
 * subscribe to only the channel they care about via `on('like')`. */
export interface SocketMessage<T = unknown> {
  type: string;
  payload: T;
}

const HEARTBEAT_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  readonly status = signal<SocketStatus>('closed');

  private socket: WebSocket | null = null;
  private readonly messages$ = new Subject<SocketMessage>();
  private heartbeatHandle?: ReturnType<typeof setInterval>;
  private reconnectHandle?: ReturnType<typeof setTimeout>;
  private reconnectAttempts = 0;
  private url = '';
  private manuallyClosed = false;

  connect(url: string): void {
    this.url = url;
    this.manuallyClosed = false;
    this.open();
  }

  /** Narrow the message stream to one channel, already typed. */
  on<T>(type: string) {
    return this.messages$.pipe(
      filter((m): m is SocketMessage<T> => m.type === type),
      map((m) => m.payload)
    );
  }

  send(message: SocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
    // If the socket is down, messages are simply dropped here. A production
    // build would queue and flush on reconnect for anything that must not
    // be lost (e.g. a sent chat message, tracked by a client-generated id).
  }

  disconnect(): void {
    this.manuallyClosed = true;
    clearInterval(this.heartbeatHandle);
    clearTimeout(this.reconnectHandle);
    this.socket?.close();
    this.status.set('closed');
  }

  private open(): void {
    this.status.set(this.reconnectAttempts === 0 ? 'connecting' : 'reconnecting');
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.status.set('open');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      try {
        this.messages$.next(JSON.parse(event.data) as SocketMessage);
      } catch {
        // Ignore malformed frames rather than crashing the socket handler.
      }
    };

    this.socket.onclose = () => {
      clearInterval(this.heartbeatHandle);
      if (!this.manuallyClosed) this.scheduleReconnect();
    };

    this.socket.onerror = () => this.socket?.close();
  }

  private startHeartbeat(): void {
    this.heartbeatHandle = setInterval(() => this.send({ type: 'ping', payload: null }), HEARTBEAT_MS);
  }

  /** Exponential backoff with jitter so that many clients reconnecting
   * after an outage don't all hit the server in the same instant. */
  private scheduleReconnect(): void {
    this.status.set('reconnecting');
    const base = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** this.reconnectAttempts);
    const jitter = Math.random() * base * 0.3;
    this.reconnectAttempts++;
    this.reconnectHandle = setTimeout(() => this.open(), base + jitter);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}