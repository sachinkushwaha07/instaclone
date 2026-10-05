import { pool } from '../../config/db';
import { Cursor } from '../../utils/cursor';

export interface NotificationRow {
  id: string;
  type: string;
  created_at: Date;
  read: boolean;
  actor_username: string;
  actor_avatar_url: string | null;
  post_thumb_url: string | null;
}

export const notificationsRepository = {
  async create(input: { userId: string; actorId: string; type: string; postId?: string }): Promise<NotificationRow> {
    const { rows } = await pool.query<NotificationRow & { id: string }>(
      `INSERT INTO notifications (user_id, actor_id, type, post_id) VALUES ($1,$2,$3,$4) RETURNING id, type, created_at, read`,
      [input.userId, input.actorId, input.type, input.postId ?? null]
    );
    // Re-select with the joined actor info so the caller (and the WS push)
    // has everything the frontend's AppNotification shape needs.
    const full = await pool.query<NotificationRow>(
      `SELECT n.id, n.type, n.created_at, n.read, u.username AS actor_username, u.avatar_url AS actor_avatar_url,
              (SELECT m.thumb_url FROM media_assets m WHERE m.post_id = n.post_id LIMIT 1) AS post_thumb_url
       FROM notifications n JOIN users u ON u.id = n.actor_id
       WHERE n.id = $1`,
      [rows[0].id]
    );
    return full.rows[0];
  },

  async list(userId: string, cursor: Cursor | null, limit: number): Promise<NotificationRow[]> {
    const params: unknown[] = [userId, limit];
    let cursorClause = '';
    if (cursor) {
      params.push(cursor.createdAt, cursor.id);
      cursorClause = `AND (n.created_at, n.id) < ($3, $4)`;
    }
    const { rows } = await pool.query<NotificationRow>(
      `SELECT n.id, n.type, n.created_at, n.read, u.username AS actor_username, u.avatar_url AS actor_avatar_url,
              (SELECT m.thumb_url FROM media_assets m WHERE m.post_id = n.post_id LIMIT 1) AS post_thumb_url
       FROM notifications n JOIN users u ON u.id = n.actor_id
       WHERE n.user_id = $1 ${cursorClause}
       ORDER BY n.created_at DESC, n.id DESC
       LIMIT $2`,
      params
    );
    return rows;
  },

  async markAllRead(userId: string): Promise<void> {
    await pool.query(`UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`, [userId]);
  },
};