import { HttpError } from '../../middleware/error.middleware';
import { broadcastToUser } from '../../realtime/ws.server';
import { Cursor, decodeCursor, encodeCursor } from '../../utils/cursor';
import { notificationsRepository } from '../notifications/notifications.repository';
import { PostRow, postsRepository } from './posts.repository';

export interface PostDto {
  id: string;
  author: { id: string; username: string; avatarUrl: string | null };
  caption: string;
  media: { id: string; kind: string; thumbUrl: string; fullUrl: string; width: number; height: number }[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  createdAt: string;
}

function toDto(row: PostRow): PostDto {
  return {
    id: row.id,
    author: { id: row.author_id, username: row.author_username, avatarUrl: row.author_avatar_url },
    caption: row.caption,
    media: row.media,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    likedByMe: row.liked_by_me,
    savedByMe: false, // saved posts aren't modeled yet; see the guide's "next steps"
    createdAt: row.created_at.toISOString(),
  };
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

export const postsService = {
  async feed(rawCursor: string | undefined, rawLimit: unknown, viewerId: string) {
    const cursor = decodeCursor(rawCursor);
    const limit = clampLimit(rawLimit);
    const rows = await postsRepository.feed(cursor, limit + 1, viewerId);
    return paginate(rows, limit);
  },

  async byAuthor(authorId: string, rawCursor: string | undefined, rawLimit: unknown, viewerId: string | null) {
    const cursor = decodeCursor(rawCursor);
    const limit = clampLimit(rawLimit);
    const rows = await postsRepository.byAuthor(authorId, cursor, limit + 1, viewerId);
    return paginate(rows, limit);
  },

  async get(postId: string, viewerId: string | null): Promise<PostDto> {
    const row = await postsRepository.byId(postId, viewerId);
    if (!row) throw new HttpError(404, 'Post not found.');
    return toDto(row);
  },

  async create(authorId: string, caption: string, mediaKeys: string[]): Promise<PostDto> {
    // A real implementation resolves each mediaKey (from the presigned
    // upload) to its stored dimensions/thumbnail via the object storage
    // metadata or a media-processing callback. Stubbed here as one
    // placeholder image asset so the create → feed round trip is testable
    // end to end without a real storage bucket.
    const media = mediaKeys.map((key) => ({
      kind: 'image',
      thumbUrl: `/api/media/files/${encodeURIComponent(key)}`,
      fullUrl: `/api/media/files/${encodeURIComponent(key)}`,
      width: 1080,
      height: 1080,
    }));
    const id = await postsRepository.create(authorId, caption, media);
    const row = await postsRepository.byId(id, authorId);
    return toDto(row!);
  },

  async like(userId: string, postId: string): Promise<void> {
    const authorId = await postsRepository.authorOf(postId);
    if (!authorId) throw new HttpError(404, 'Post not found.');

    await postsRepository.like(userId, postId);

    if (authorId !== userId) {
      const notification = await notificationsRepository.create({ userId: authorId, actorId: userId, type: 'like', postId });
      // Push over the socket so the author's navbar badge updates without
      // a refresh — the browser-side counterpart is NotificationsStore's
      // `receive()`, subscribed in withHooks.onInit.
      broadcastToUser(authorId, {
        type: 'notification',
        payload: {
          id: notification.id,
          type: notification.type,
          actorUsername: notification.actor_username,
          actorAvatarUrl: notification.actor_avatar_url,
          postThumbUrl: notification.post_thumb_url ?? undefined,
          createdAt: notification.created_at.toISOString(),
          read: notification.read,
        },
      });
    }
  },

  async unlike(userId: string, postId: string): Promise<void> {
    await postsRepository.unlike(userId, postId);
  },
};

function clampLimit(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

/** Classic "fetch one extra row" trick: asking for `limit + 1` tells us
 * whether a next page exists without a separate COUNT(*) query. */
function paginate(rows: PostRow[], limit: number): { items: PostDto[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? encodeCursor({ createdAt: last.created_at.toISOString(), id: last.id } as Cursor) : null;
  return { items: page.map(toDto), nextCursor };
}
