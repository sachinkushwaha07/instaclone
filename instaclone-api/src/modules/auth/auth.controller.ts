import { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env';
import { HttpError } from '../../middleware/error.middleware';
import { authService } from './auth.service';
import { loginSchema, registerSchema } from './auth.validation';

const REFRESH_COOKIE_NAME = 'refresh_token';

/**
 * `httpOnly` means client-side JavaScript can never read this cookie, so
 * an XSS payload that steals `document.cookie` still can't get the
 * refresh token. `sameSite: 'lax'` stops it being sent on cross-site
 * requests (CSRF protection) while still allowing normal top-level
 * navigation. `secure` must be true in production (HTTPS-only) — see the
 * Nginx section, which terminates TLS in front of this server.
 */
function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/api/auth', // only sent on auth endpoints, not on every API call
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function sendAuthResult(res: Response, result: Awaited<ReturnType<typeof authService.login>>): void {
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions());
  res.json({ accessToken: result.accessToken, user: result.user }); // matches AuthResponse in the Angular app
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, 'Invalid input.', flatten(parsed.error));
    const result = await authService.register(parsed.data);
    sendAuthResult(res, result);
  },

  async login(req: Request, res: Response): Promise<void> {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, 'Invalid input.', flatten(parsed.error));
    const result = await authService.login(parsed.data.identifier, parsed.data.password);
    sendAuthResult(res, result);
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!raw) throw new HttpError(401, 'No session found.');
    const result = await authService.refresh(raw);
    sendAuthResult(res, result);
  },

  async logout(req: Request, res: Response): Promise<void> {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    await authService.logout(raw);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    res.status(204).send();
  },
};

function flatten(error: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[issue.path.join('.')] = issue.message;
  return out;
}