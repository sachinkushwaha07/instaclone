import { env } from '../../config/env';
import { HttpError } from '../../middleware/error.middleware';
import { hashPassword, verifyPassword } from '../../utils/password';
import { generateRefreshToken, hashRefreshToken, signAccessToken } from '../../utils/tokens';
import { authRepository, UserRow } from './auth.repository';

export interface CurrentUserDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AuthResultDto {
  accessToken: string;
  refreshToken: string; // controller puts this in an httpOnly cookie; never returned in the JSON body
  user: CurrentUserDto;
}

function toDto(row: UserRow): CurrentUserDto {
  return { id: row.id, username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url };
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

async function issueTokens(user: UserRow): Promise<AuthResultDto> {
  const accessToken = signAccessToken({ sub: user.id, username: user.username });
  const refreshToken = generateRefreshToken();
  await authRepository.storeRefreshToken(user.id, hashRefreshToken(refreshToken), refreshExpiry());
  return { accessToken, refreshToken, user: toDto(user) };
}

export const authService = {
  async register(input: { email: string; username: string; displayName: string; password: string }): Promise<AuthResultDto> {
    if (await authRepository.emailOrUsernameTaken(input.email, input.username)) {
      throw new HttpError(409, 'That email or username is already taken.', {
        email: 'Already in use',
        username: 'Already in use',
      });
    }

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash,
    });
    return issueTokens(user);
  },

  async login(identifier: string, password: string): Promise<AuthResultDto> {
    const user = await authRepository.findByEmailOrUsername(identifier);
    // Same error for "no such user" and "wrong password" — telling them
    // apart lets an attacker enumerate which emails/usernames exist.
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new HttpError(401, 'Incorrect username or password.');
    }
    return issueTokens(user);
  },

  /**
   * Rotation with reuse detection. Every refresh call:
   *  1. consumes (revokes) the token it was given, and
   *  2. issues a brand new one.
   * A legitimate client always has the newest token, so this is invisible
   * to it. But if a stolen refresh token is ever replayed after the real
   * client has already rotated past it, that token is already revoked —
   * which is exactly the "attacker replaying an old token" case — and we
   * respond by revoking every session for that user, forcing a clean
   * re-login everywhere the stolen token might be in use.
   */
  async refresh(rawToken: string): Promise<AuthResultDto> {
    const tokenHash = hashRefreshToken(rawToken);
    const record = await authRepository.findValidRefreshToken(tokenHash);

    if (!record) throw new HttpError(401, 'Session expired. Please log in again.');

    if (record.revoked) {
      await authRepository.revokeAllForUser(record.user_id);
      throw new HttpError(401, 'Session invalidated for your protection. Please log in again.');
    }

    await authRepository.revokeRefreshToken(record.id);

    const user = await authRepository.findById(record.user_id);
    if (!user) throw new HttpError(401, 'Account no longer exists.');

    return issueTokens(user);
  },

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const record = await authRepository.findValidRefreshToken(hashRefreshToken(rawToken));
    if (record) await authRepository.revokeRefreshToken(record.id);
  },
};