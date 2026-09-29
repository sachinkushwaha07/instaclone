import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}

/** Normalizes every HTTP failure into a consistent ApiError shape so
 * components never branch on the raw HttpErrorResponse structure. */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const apiError: ApiError = {
          status: err.status,
          message: err.error?.message ?? defaultMessageFor(err.status),
          fieldErrors: err.error?.fieldErrors,
        };
        return throwError(() => apiError);
      }
      return throwError(() => err);
    })
  );

function defaultMessageFor(status: number): string {
  switch (status) {
    case 0:
      return 'Network error. Check your connection.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return 'Not found.';
    case 429:
      return 'Too many requests. Slow down a little.';
    default:
      return 'Something went wrong. Please try again.';
  }
}