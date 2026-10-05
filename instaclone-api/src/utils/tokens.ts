import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string; // user id
  username: string;
}

/** Short-lived, sent in the Authorization header on every request. Kept in
 * memory on the frontend (an Angular signal), never in localStorage, so
 * it isn't readable by an XSS payload that runs after the page loads. */
export function signAccessToken(payload: AccessTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/**
 * The refresh token itself is a random opaque string, not a JWT — the
 * server is the only thing that ever needs to look it up, so there's
 * nothing to gain from it being self-describing. We store its SHA-256
 * hash in the database (see refresh_tokens table) and only ever compare
 * hashes, the same principle as password storage: a DB leak shouldn't
 * hand out usable sessions.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}