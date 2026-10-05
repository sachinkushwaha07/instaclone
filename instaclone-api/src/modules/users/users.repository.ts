import { pool } from '../../config/db';

export interface UserProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
  followed_by_me: boolean;
}

const SELECT_PROFILE = `
  u.id, u.username, u.display_name, u.bio, u.avatar_url,
  (SELECT count(*)::int FROM follows f WHERE f.followed_id = u.id) AS follower_count,
  (SELECT count(*)::int FROM follows f WHERE f.follower_id = u.id) AS following_count,
  (SELECT count(*)::int FROM posts p WHERE p.author_id = u.id) AS post_count,
  ($2::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = $2 AND f.followed_id = u.id)) AS followed_by_me
`;

export const usersRepository = {
  async byUsername(username: string, viewerId: string | null): Promise<UserProfileRow | null> {
    const { rows } = await pool.query<UserProfileRow>(
      `SELECT ${SELECT_PROFILE} FROM users u WHERE u.username = $1`,
      [username, viewerId]
    );
    return rows[0] ?? null;
  },

  async follow(followerId: string, followedId: string): Promise<void> {
    if (followerId === followedId) return;
    await pool.query(`INSERT INTO follows (follower_id, followed_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [
      followerId,
      followedId,
    ]);
  },

  async unfollow(followerId: string, followedId: string): Promise<void> {
    await pool.query(`DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2`, [followerId, followedId]);
  },

  async idByUsername(username: string): Promise<string | null> {
    const { rows } = await pool.query<{ id: string }>(`SELECT id FROM users WHERE username = $1`, [username]);
    return rows[0]?.id ?? null;
  },

  async search(query: string, viewerId: string | null): Promise<UserProfileRow[]> {
    const { rows } = await pool.query<UserProfileRow>(
      `SELECT ${SELECT_PROFILE} FROM users u
       WHERE u.username ILIKE $1 OR u.display_name ILIKE $1
       ORDER BY u.username LIMIT 20`,
      [`%${query}%`, viewerId]
    );
    return rows;
  },
};