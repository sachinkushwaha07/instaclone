import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LiveRoomToken, LiveSession } from './live.model';

/**
 * The frontend never talks to the media provider's control plane directly.
 * The backend creates the room and mints a scoped token; the client only
 * uses that token to connect with the provider's SDK (see features/live).
 */
@Injectable({ providedIn: 'root' })
export class LiveApi {
  private readonly http = inject(HttpClient);

  currentlyLive(): Observable<LiveSession[]> {
    return this.http.get<LiveSession[]>('/api/live');
  }

  startBroadcast(title: string): Observable<LiveRoomToken> {
    return this.http.post<LiveRoomToken>('/api/live/start', { title });
  }

  joinAsViewer(roomId: string): Observable<LiveRoomToken> {
    return this.http.post<LiveRoomToken>(`/api/live/${roomId}/join`, {});
  }

  end(roomId: string): Observable<void> {
    return this.http.post<void>(`/api/live/${roomId}/end`, {});
  }
}