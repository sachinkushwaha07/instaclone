import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfile } from './user.model';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  byUsername(username: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`/api/users/by-username/${username}`);
  }

  follow(userId: string): Observable<void> {
    return this.http.post<void>(`/api/users/${userId}/follow`, {});
  }

  unfollow(userId: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${userId}/follow`);
  }

  search(query: string): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>('/api/users/search', { params: { q: query } });
  }
}