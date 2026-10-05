import { Cursor, decodeCursor, encodeCursor } from '../../utils/cursor';
import { NotificationRow, notificationsRepository } from './notifications.repository';

export interface NotificationDto {
  id: string;
  type: string;
  actorUsername: string;
  actorAvatarUrl: string | null;
  postThumbUrl?: string;
  createdAt: string;
  read: boolean;
}

function toDto(row: NotificationRow): NotificationDto {
  return {
    id: row.id,
    type: row.type,
    actorUsername: row.actor_username,
    actorAvatarUrl: row.actor_avatar_url,
    postThumbUrl: row.post_thumb_url ?? undefined,
    createdAt: row.created_at.toISOString(),
    read: row.read,
  };
}

const LIMIT = 20;

export const notificationsService = {
  async list(userId: string, rawCursor: string | undefined) {
    const cursor = decodeCursor(rawCursor);
    const rows = await notificationsRepository.list(userId, cursor, LIMIT + 1);
    const hasMore = rows.length > LIMIT;
    const page = hasMore ? rows.slice(0, LIMIT) : rows;
    const last = page[page.length - 1];
    const nextCursor = hasMore && last ? encodeCursor({ createdAt: last.created_at.toISOString(), id: last.id } as Cursor) : null;
    return { items: page.map(toDto), nextCursor };
  },

  markAllRead(userId: string): Promise<void> {
    return notificationsRepository.markAllRead(userId);
  },
};
