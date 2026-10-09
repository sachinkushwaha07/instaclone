import { pool } from '../../config/db';

export const chatRepository = {
  async userExists(userId: string): Promise<boolean> {
    return ((await pool.query('SELECT 1 FROM users WHERE id = $1', [userId])).rowCount ?? 0) > 0;
  },
  async isMember(conversationId: string, userId: string): Promise<boolean> {
    return ((await pool.query('SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2', [conversationId, userId])).rowCount ?? 0) > 0;
  },
  async create(userId: string, participantId: string) {
    const directKey = [userId, participantId].sort().join(':');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO conversations (direct_key) VALUES ($1) ON CONFLICT (direct_key) DO UPDATE SET direct_key = EXCLUDED.direct_key RETURNING id`, [directKey]
      );
      const id = rows[0].id;
      await client.query('INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1,$2),($1,$3) ON CONFLICT DO NOTHING', [id, userId, participantId]);
      await client.query('COMMIT');
      return { id, participantIds: [userId, participantId], lastMessage: null, lastMessageAt: null, unreadCount: 0 };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },
  async list(userId: string) {
    const { rows } = await pool.query(
      `SELECT c.id, array_agg(cm.user_id) AS "participantIds", last.text AS "lastMessage", last.created_at AS "lastMessageAt", 0::int AS "unreadCount"
       FROM conversations c JOIN conversation_members mine ON mine.conversation_id = c.id AND mine.user_id = $1
       JOIN conversation_members cm ON cm.conversation_id = c.id
       LEFT JOIN LATERAL (SELECT text, created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1) last ON true
       GROUP BY c.id, last.text, last.created_at ORDER BY last.created_at DESC NULLS LAST`, [userId]
    );
    return rows;
  },
  async messages(conversationId: string) {
    const { rows } = await pool.query(
      `SELECT id, conversation_id AS "conversationId", sender_id AS "senderId", text, created_at AS "createdAt", 'sent' AS status
       FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC, id ASC`, [conversationId]
    );
    return rows;
  },
  async send(conversationId: string, senderId: string, text: string) {
    const { rows } = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, text) VALUES ($1,$2,$3)
       RETURNING id, conversation_id AS "conversationId", sender_id AS "senderId", text, created_at AS "createdAt", 'sent' AS status`, [conversationId, senderId, text]
    );
    return rows[0];
  },
};
