import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../page.model';
import { AppNotification } from './notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient);

  list(cursor: string | null): Observable<Page<AppNotification>> {
    return this.http.get<Page<AppNotification>>('/api/notifications', {
      params: cursor ? { cursor } : {},
    });
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>('/api/notifications/read-all', {});
  }
}