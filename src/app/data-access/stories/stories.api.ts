import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StoryGroup } from './story.model';

@Injectable({ providedIn: 'root' })
export class StoriesApi {
  private readonly http = inject(HttpClient);

  tray(): Observable<StoryGroup[]> {
    return this.http.get<StoryGroup[]>('/api/stories/tray');
  }

  /** Batched: the viewer calls this with ids collected over a few seconds
   * rather than firing one request per story, to avoid flooding the API. */
  markSeen(storyIds: string[]): Observable<void> {
    return this.http.post<void>('/api/stories/seen', { storyIds });
  }

  create(payload: { mediaKey: string; kind: 'image' | 'video' }): Observable<void> {
    return this.http.post<void>('/api/stories', payload);
  }
}