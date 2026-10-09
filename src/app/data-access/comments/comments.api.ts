import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Comment } from './comment.model';

@Injectable({ providedIn: 'root' })
export class CommentsApi {
  private readonly http = inject(HttpClient);

  list(postId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`/api/posts/${postId}/comments`);
  }

  create(postId: string, text: string): Observable<Comment> {
    return this.http.post<Comment>(`/api/posts/${postId}/comments`, { text });
  }
}
