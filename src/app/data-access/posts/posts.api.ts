import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../page.model';
import { Post } from './post.model';

/**
 * Data-access services only talk HTTP and return typed observables.
 * They hold no component-facing state — that's the job of a store in
 * features/. This keeps the API layer trivially mockable in tests.
 */
@Injectable({ providedIn: 'root' })
export class PostsApi {
  private readonly http = inject(HttpClient);

  feed(cursor: string | null, limit = 10): Observable<Page<Post>> {
    return this.http.get<Page<Post>>('/api/feed', { params: { limit, ...(cursor ? { cursor } : {}) } });
  }

  byUser(userId: string, cursor: string | null, limit = 24): Observable<Page<Post>> {
    return this.http.get<Page<Post>>(`/api/users/${userId}/posts`, {
      params: { limit, ...(cursor ? { cursor } : {}) },
    });
  }

  get(postId: string): Observable<Post> {
    return this.http.get<Post>(`/api/posts/${postId}`);
  }

  like(postId: string): Observable<void> {
    return this.http.post<void>(`/api/posts/${postId}/like`, {});
  }

  unlike(postId: string): Observable<void> {
    return this.http.delete<void>(`/api/posts/${postId}/like`);
  }

  /** Step 2 of upload: after the file is PUT to the presigned URL. */
  create(payload: { mediaKeys: string[]; caption: string }): Observable<Post> {
    return this.http.post<Post>('/api/posts', payload);
  }

  /** Step 1 of upload: get a short-lived URL to PUT the raw file to object
   * storage directly, so large media never passes through this API. */
  requestUploadUrl(fileName: string, contentType: string): Observable<{ uploadUrl: string; key: string }> {
    return this.http.post<{ uploadUrl: string; key: string }>('/api/media/presign', { fileName, contentType });
  }
}