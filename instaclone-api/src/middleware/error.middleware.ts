import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Custom errors carry an HTTP status; anything else becomes a 500. Thrown
 * from a service layer, caught here — controllers never need try/catch. */
export class HttpError extends Error {
  constructor(public status: number, message: string, public fieldErrors?: Record<string, string>) {
    super(message);
  }
}

/** Wraps an async Express handler so a rejected promise reaches the error
 * middleware instead of crashing the process (Express 4 doesn't do this
 * automatically for async functions). */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, fieldErrors: err.fieldErrors });
    return;
  }

  if (isDatabaseUnavailable(err)) {
    console.error('Database connection unavailable:', err);
    res.status(503).json({ message: 'Registration is temporarily unavailable. Please try again shortly.' });
    return;
  }

  // Never leak internals (stack traces, SQL, file paths) to the client.
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
}

/** pg may surface a connection failure directly or inside AggregateError. */
function isDatabaseUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; errors?: unknown[] };
  if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(String(candidate.code))) return true;
  return candidate.errors?.some(isDatabaseUnavailable) ?? false;
}
