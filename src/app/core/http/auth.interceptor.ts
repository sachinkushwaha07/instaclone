import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

// Shared across all requests in this interceptor's module scope so that
// several parallel 401s don't each trigger their own /refresh call.
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

/**
 * Attaches the bearer token to every request, and on a 401, refreshes the
 * session exactly once and replays the queued requests with the new token.
 * This avoids the "refresh race" that logs users out when rotating refresh
 * tokens are used and multiple requests fail at the same time.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const token = auth.accessToken();

  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || req.url.includes('/auth/refresh')) {
        return throwError(() => err);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshedToken$.next(null);

        return auth.refresh().pipe(
          switchMap((newToken) => {
            isRefreshing = false;
            refreshedToken$.next(newToken);
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
          }),
          catchError((refreshErr) => {
            isRefreshing = false;
            auth.logout();
            return throwError(() => refreshErr);
          })
        );
      }

      // A refresh is already in flight: wait for it, then replay this request.
      return refreshedToken$.pipe(
        filter((t): t is string => t !== null),
        take(1),
        switchMap((t) => next(req.clone({ setHeaders: { Authorization: `Bearer ${t}` } })))
      );
    })
  );
};