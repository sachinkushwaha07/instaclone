import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/tokens';

// Augment Express's Request type so `req.userId` is typed everywhere it's used.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      username?: string;
    }
  }
}

/**
 * Mirrors the Angular `authInterceptor`: that interceptor attaches
 * `Authorization: Bearer <token>` to every request; this middleware reads
 * it back. Returning 401 here (rather than 403) is what the frontend's
 * interceptor is watching for — a 401 on any request but `/auth/refresh`
 * triggers its single-flight refresh-and-retry flow.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Missing access token.' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.username = payload.username;
    next();
  } catch {
    // Covers both an expired token and a tampered/invalid one; the
    // frontend interceptor treats every 401 the same way, so we don't
    // need to distinguish the reason in the response body.
    res.status(401).json({ message: 'Invalid or expired access token.' });
  }
}

/** For routes that behave differently when logged in but don't require it
 * (e.g. a post's `likedByMe` flag). Never rejects; just populates `req.userId`
 * when a valid token is present. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.userId = payload.sub;
      req.username = payload.username;
    } catch {
      // ignore — treat as anonymous
    }
  }
  next();
}