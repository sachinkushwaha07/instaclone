import { pool } from '../../config/db';

export interface UserRow {
  id: string;
  email: string;
  username: string;
  display_name: string;
  password_hash: string;
  avatar_url: string | null;
}

export const authRepository = {
  async findByEmailOrUsername(identifier: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      `SELECT id, email, username, display_name, password_hash, avatar_url
       FROM users WHERE email = $1 OR username = $1 LIMIT 1`,
      [identifier]
    );
    return rows[0] ?? null;
  },

  async emailOrUsernameTaken(email: string, username: string): Promise<boolean> {
    const { rows } = await pool.query(`SELECT 1 FROM users WHERE email = $1 OR username = $2 LIMIT 1`, [
      email,
      username,
    ]);
    return rows.length > 0;
  },

  async createUser(input: {
    email: string;
    username: string;
    displayName: string;
    passwordHash: string;
  }): Promise<UserRow> {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (email, username, display_name, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, display_name, password_hash, avatar_url`,
      [input.email, input.username, input.displayName, input.passwordHash]
    );
    return rows[0];
  },

  async findById(userId: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      `SELECT id, email, username, display_name, password_hash, avatar_url FROM users WHERE id = $1`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async storeRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await pool.query(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [
      userId,
      tokenHash,
      expiresAt,
    ]);
  },

  async findValidRefreshToken(tokenHash: string): Promise<{ id: string; user_id: string; revoked: boolean } | null> {
    const { rows } = await pool.query(
      `SELECT id, user_id, revoked FROM refresh_tokens WHERE token_hash = $1 AND expires_at > now()`,
      [tokenHash]
    );
    return rows[0] ?? null;
  },

  async revokeRefreshToken(id: string): Promise<void> {
    await pool.query(`UPDATE refresh_tokens SET revoked = true WHERE id = $1`, [id]);
  },

  /** Used when reuse of an already-rotated token is detected — a strong
   * signal the token was stolen. Revoking every session forces a fresh
   * login everywhere, which is the safe default response to that signal. */
  async revokeAllForUser(userId: string): Promise<void> {
    await pool.query(`UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`, [userId]);
  },
};