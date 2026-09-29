import { DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { NotificationsApi } from '../../data-access/notifications/notifications.api';
import { AppNotification } from '../../data-access/notifications/notification.model';
import { WebSocketService } from '../../core/realtime/websocket.service';

interface NotificationsState {
  items: AppNotification[];
  cursor: string | null;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
}

const initialState: NotificationsState = { items: [], cursor: null, loading: false, hasMore: true, error: null };

export const NotificationsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items }) => ({
    unreadCount: computed(() => items().filter((n) => !n.read).length),
  })),
  withMethods((store, api = inject(NotificationsApi)) => ({
    async loadMore(): Promise<void> {
      if (store.loading() || !store.hasMore()) return;
      patchState(store, { loading: true, error: null });
      try {
        const page = await firstValueFrom(api.list(store.cursor()));
        patchState(store, (s) => ({
          items: [...s.items, ...page.items.filter((n) => !s.items.some((e) => e.id === n.id))],
          cursor: page.nextCursor,
          hasMore: page.nextCursor !== null,
          loading: false,
        }));
      } catch {
        patchState(store, { loading: false, error: 'Could not load notifications.' });
      }
    },
    receive(notification: AppNotification): void {
      patchState(store, (s) =>
        s.items.some((n) => n.id === notification.id) ? s : { items: [notification, ...s.items] }
      );
    },
    async markAllRead(): Promise<void> {
      const before = store.items();
      if (!before.some((n) => !n.read)) return;
      patchState(store, { items: before.map((n) => ({ ...n, read: true })) });
      try {
        await firstValueFrom(api.markAllRead());
      } catch {
        patchState(store, { items: before });
      }
    },
  })),
  withHooks((store, ws = inject(WebSocketService), destroyRef = inject(DestroyRef)) => ({
    onInit() {
      ws.on<AppNotification>('notification')
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe((n) => store.receive(n));
    },
  }))
);