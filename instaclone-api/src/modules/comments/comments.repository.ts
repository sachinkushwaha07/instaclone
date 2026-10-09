import { pool } from '../../config/db';

export interface CommentRow {
  id: string;
  post_id: string;
  text: string;
  created_at: Date;
  author_id: string;
  author_username: string;
  author_avatar_url: string | null;
}

const fields = `c.id, c.post_id, c.text, c.created_at, c.author_id,
  u.username AS author_username, u.avatar_url AS author_avatar_url`;

export const commentsRepository = {
  async list(postId: string): Promise<CommentRow[]> {
    const { rows } = await pool.query<CommentRow>(
      `SELECT ${fields} FROM comments c JOIN users u ON u.id = c.author_id
       WHERE c.post_id = $1 ORDER BY c.created_at ASC, c.id ASC`,
      [postId]
    );
    return rows;
  },

  async create(postId: string, authorId: string, text: string): Promise<CommentRow> {
    const { rows } = await pool.query<CommentRow>(
      `WITH inserted AS (
         INSERT INTO comments (post_id, author_id, text) VALUES ($1, $2, $3)
         RETURNING id, post_id, text, created_at, author_id
       )
       SELECT ${fields} FROM inserted c JOIN users u ON u.id = c.author_id`,
      [postId, authorId, text]
    );
    return rows[0];
  },

  async postAuthor(postId: string): Promise<string | null> {
    const { rows } = await pool.query<{ author_id: string }>('SELECT author_id FROM posts WHERE id = $1', [postId]);
    return rows[0]?.author_id ?? null;
  },
};
