import { pool } from '../../config/db';

export interface StoryRow {
  id: string;
  media_url: string;
  kind: string;
  duration_ms: number;
  created_at: Date;
  expires_at: Date;
  author_id: string;
  author_username: string;
  author_avatar_url: string | null;
  seen_by_me: boolean;
}

export const storiesRepository = {
  async create(input: {
    authorId: string;
    mediaUrl: string;
    kind: 'image' | 'video';
    durationMs: number;
  }): Promise<string> {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO stories (author_id, media_url, kind, duration_ms, expires_at)
       VALUES ($1, $2, $3, $4, now() + interval '24 hours')
       RETURNING id`,
      [input.authorId, input.mediaUrl, input.kind, input.durationMs]
    );
    return rows[0].id;
  },

  /**
   * The tray shows the viewer's own stories plus everyone they follow,
   * filtered to unexpired stories only. `expires_at > now()` in the WHERE
   * clause is what makes 24-hour expiry work — there's no cleanup job
   * required, an expired story simply stops being selected. A production
   * app would still add a periodic DELETE for expired rows so the table
   * doesn't grow forever, but correctness doesn't depend on it.
   */
  async trayFor(viewerId: string): Promise<StoryRow[]> {
    const { rows } = await pool.query<StoryRow>(
      `SELECT s.id, s.media_url, s.kind, s.duration_ms, s.created_at, s.expires_at,
              s.author_id, u.username AS author_username, u.avatar_url AS author_avatar_url,
              EXISTS (SELECT 1 FROM story_seen ss WHERE ss.story_id = s.id AND ss.user_id = $1) AS seen_by_me
       FROM stories s
       JOIN users u ON u.id = s.author_id
       WHERE s.expires_at > now()
         AND (s.author_id = $1 OR s.author_id IN (SELECT followed_id FROM follows WHERE follower_id = $1))
       ORDER BY s.author_id, s.created_at ASC`,
      [viewerId]
    );
    return rows;
  },

  /**
   * One INSERT for the whole batch, using unnest() to expand the array
   * into rows — this is what lets the frontend send a handful of seen IDs
   * collected over several seconds as a single request instead of one
   * request per story (see the frontend guide's story-viewer section).
   * ON CONFLICT DO NOTHING makes it safe to send an ID that's already
   * marked seen.
   */
  async markSeen(userId: string, storyIds: string[]): Promise<void> {
    if (storyIds.length === 0) return;
    await pool.query(
      `INSERT INTO story_seen (user_id, story_id)
       SELECT $1, unnest($2::uuid[])
       ON CONFLICT DO NOTHING`,
      [userId, storyIds]
    );
  },
};