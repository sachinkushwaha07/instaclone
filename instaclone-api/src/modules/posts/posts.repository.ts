import { pool } from '../../config/db';
import { Cursor } from '../../utils/cursor';

export interface PostRow {
  id: string;
  caption: string;
  created_at: Date;
  author_id: string;
  author_username: string;
  author_avatar_url: string | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  media: { id: string; kind: string; thumbUrl: string; fullUrl: string; width: number; height: number }[];
}

/** Builds the shared SELECT fragment with the viewer-id placeholder at a
 * caller-chosen position. Every query in this file has the viewer id in a
 * different param slot (its position shifts depending on how many other
 * params — cursor values, limit — come before it), so the fragment can't
 * hardcode `$2`: an unused placeholder that never appears in the final SQL
 * text is a Postgres error ("could not determine data type of parameter"),
 * and a hardcoded wrong index silently binds the wrong value instead. */
function selectPostFields(viewerParam: number): string {
  return `
  p.id, p.caption, p.created_at, p.author_id,
  u.username AS author_username, u.avatar_url AS author_avatar_url,
  (SELECT count(*)::int FROM likes l WHERE l.post_id = p.id) AS like_count,
  (SELECT count(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
  ($${viewerParam}::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $${viewerParam})) AS liked_by_me,
  COALESCE(
    (SELECT json_agg(json_build_object(
        'id', m.id, 'kind', m.kind, 'thumbUrl', m.thumb_url, 'fullUrl', m.full_url,
        'width', m.width, 'height', m.height
      ))
     FROM media_assets m WHERE m.post_id = p.id),
    '[]'
  ) AS media
`;
}

export const postsRepository = {
  /**
   * Keyset pagination: `WHERE (created_at, id) < (cursor)` instead of
   * OFFSET. This is what makes the feed stable while new posts are being
   * written concurrently — see the frontend guide's explanation of why
   * cursors were chosen over `?page=n`.
   */
  async feed(cursor: Cursor | null, limit: number, viewerId: string | null): Promise<PostRow[]> {
    const params: unknown[] = [limit, viewerId];
    let where = '';
    if (cursor) {
      params.push(cursor.createdAt, cursor.id);
      where = `WHERE (p.created_at, p.id) < ($3, $4)`;
    }

    const { rows } = await pool.query(
      `SELECT ${selectPostFields(2)}
       FROM posts p JOIN users u ON u.id = p.author_id
       ${where}
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT $1`,
      params
    );
    return rows;
  },

  async byAuthor(authorId: string, cursor: Cursor | null, limit: number, viewerId: string | null): Promise<PostRow[]> {
    const params: unknown[] = [limit, viewerId, authorId];
    let cursorClause = '';
    if (cursor) {
      params.push(cursor.createdAt, cursor.id);
      cursorClause = `AND (p.created_at, p.id) < ($4, $5)`;
    }
    const { rows } = await pool.query(
      `SELECT ${selectPostFields(2)}
       FROM posts p JOIN users u ON u.id = p.author_id
       WHERE p.author_id = $3 ${cursorClause}
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT $1`,
      params
    );
    return rows;
  },

  async byId(postId: string, viewerId: string | null): Promise<PostRow | null> {
    const { rows } = await pool.query(
      `SELECT ${selectPostFields(1)} FROM posts p JOIN users u ON u.id = p.author_id WHERE p.id = $2`,
      [viewerId, postId]
    );
    return rows[0] ?? null;
  },

  async create(authorId: string, caption: string, media: { kind: string; thumbUrl: string; fullUrl: string; width: number; height: number }[]): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO posts (author_id, caption) VALUES ($1, $2) RETURNING id`,
        [authorId, caption]
      );
      const postId = rows[0].id;
      for (const m of media) {
        await client.query(
          `INSERT INTO media_assets (post_id, kind, thumb_url, full_url, width, height) VALUES ($1,$2,$3,$4,$5,$6)`,
          [postId, m.kind, m.thumbUrl, m.fullUrl, m.width, m.height]
        );
      }
      await client.query('COMMIT');
      return postId;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  /** ON CONFLICT DO NOTHING makes double-clicking "like" harmless instead
   * of a duplicate-key error — the primary key is (user_id, post_id). */
  async like(userId: string, postId: string): Promise<void> {
    await pool.query(`INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [userId, postId]);
  },

  async unlike(userId: string, postId: string): Promise<void> {
    await pool.query(`DELETE FROM likes WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
  },

  async authorOf(postId: string): Promise<string | null> {
    const { rows } = await pool.query<{ author_id: string }>(`SELECT author_id FROM posts WHERE id = $1`, [postId]);
    return rows[0]?.author_id ?? null;
  },
};
