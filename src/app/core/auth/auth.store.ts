import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom, map, Observable, tap } from 'rxjs';
import { AuthResponse, CurrentUser, LoginPayload, RegisterPayload } from './auth.models';

interface AuthState {
  user: CurrentUser | null;
  accessToken: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: 'idle',
  error: null,
};

/** Frontend-only account for exercising the UI without an API server. */
const demoCredentials = {
  identifiers: ['demo', 'demo@instaclone.local'],
  password: 'demo123',
  user: {
    id: 'demo-user',
    username: 'demo',
    displayName: 'Demo User',
    avatarUrl: null,
  } satisfies CurrentUser,
};

/**
 * Single source of truth for "who is logged in". Kept in core (not
 * features/auth) because the interceptor, route guards, and layout shell
 * all need it, and core is the one layer every part of the app can import.
 */
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, status }) => ({
    isAuthenticated: computed(() => status() === 'authenticated'),
    initials: computed(() => (user()?.displayName ?? '?').slice(0, 1).toUpperCase()),
  })),
  withMethods((store, http = inject(HttpClient)) => ({
    async login(payload: LoginPayload): Promise<void> {
      patchState(store, { status: 'loading', error: null });
      try {
        const identifier = payload.identifier.trim().toLowerCase();
        if (demoCredentials.identifiers.includes(identifier) && payload.password === demoCredentials.password) {
          patchState(store, {
            user: demoCredentials.user,
            accessToken: 'demo-access-token',
            status: 'authenticated',
          });
          return;
        }

        const res = await firstValueFrom(http.post<AuthResponse>('/api/auth/login', payload));
        patchState(store, { user: res.user, accessToken: res.accessToken, status: 'authenticated' });
      } catch (e) {
        patchState(store, { status: 'error', error: (e as { message?: string }).message ?? 'Login failed' });
        throw e;
      }
    },

    /** Called only by the auth interceptor on a 401. Cookie carries the
     * refresh token, so nothing sensitive is passed in the body. */
    async register(payload: RegisterPayload): Promise<void> {
      patchState(store, { status: 'loading', error: null });
      try {
        const res = await firstValueFrom(http.post<AuthResponse>('/api/auth/register', payload));
        patchState(store, { user: res.user, accessToken: res.accessToken, status: 'authenticated' });
      } catch (e) {
        patchState(store, { status: 'error', error: (e as { message?: string }).message ?? 'Sign up failed' });
        throw e;
      }
    },

    refresh(): Observable<string> {
      return http.post<AuthResponse>('/api/auth/refresh', {}, { withCredentials: true }).pipe(
        tap((res) => patchState(store, { user: res.user, accessToken: res.accessToken, status: 'authenticated' })),
        map((res) => res.accessToken)
      );
    },

    logout(): void {
      http.post('/api/auth/logout', {}, { withCredentials: true }).subscribe();
      patchState(store, initialState);
    },

    hydrateFromRefreshCookie(): Promise<void> {
      // Called once on app start so a page reload doesn't force a re-login.
      return firstValueFrom(this.refresh()).then(
        () => void 0,
        () => patchState(store, initialState)
      );
    },
  }))
);
