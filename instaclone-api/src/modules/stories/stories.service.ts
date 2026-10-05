import { HttpError } from '../../middleware/error.middleware';
import { StoryRow, storiesRepository } from './stories.repository';

export interface StoryDto {
  id: string;
  mediaUrl: string;
  kind: 'image' | 'video';
  durationMs: number;
  createdAt: string;
  seenByMe: boolean;
}

export interface StoryGroupDto {
  user: { id: string; username: string; avatarUrl: string | null };
  stories: StoryDto[];
  hasUnseen: boolean;
}

const IMAGE_DURATION_MS = 5000;

export const storiesService = {
  /**
   * The repository returns one flat row per story, ordered by author.
   * Grouping them here (rather than in SQL) keeps the query simple and
   * puts shaping logic where it's easy to test and change — a JSON-agg
   * in SQL would work too, but is harder to read and debug than this.
   */
  async tray(viewerId: string): Promise<StoryGroupDto[]> {
    const rows = await storiesRepository.trayFor(viewerId);

    const groups = new Map<string, StoryGroupDto>();
    for (const row of rows) {
      if (!groups.has(row.author_id)) {
        groups.set(row.author_id, {
          user: { id: row.author_id, username: row.author_username, avatarUrl: row.author_avatar_url },
          stories: [],
          hasUnseen: false,
        });
      }
      const group = groups.get(row.author_id)!;
      group.stories.push(toDto(row));
      if (!row.seen_by_me) group.hasUnseen = true;
    }

    // The viewer's own ring should never show as "unseen" — you've
    // obviously seen your own story. Everyone else keeps hasUnseen as
    // computed above, which drives the gradient ring in the tray.
    const own = groups.get(viewerId);
    if (own) own.hasUnseen = false;

    // Put the viewer's own stories first (matches Instagram's convention:
    // "Your story" is always the leftmost tray entry), followed by
    // everyone else in the order the query returned them.
    const ordered = [...groups.values()];
    ordered.sort((a, b) => (a.user.id === viewerId ? -1 : b.user.id === viewerId ? 1 : 0));
    return ordered;
  },

  async create(authorId: string, mediaKey: string, kind: 'image' | 'video'): Promise<void> {
    if (!mediaKey) throw new HttpError(400, 'mediaKey is required.');
    // As with posts, a real implementation resolves mediaKey to a stored
    // object-storage URL and, for video, reads back the real clip length
    // from a transcoding callback rather than a fixed constant.
    const mediaUrl = `/api/media/files/${encodeURIComponent(mediaKey)}`;
    const durationMs = kind === 'video' ? 15000 : IMAGE_DURATION_MS;
    await storiesRepository.create({ authorId, mediaUrl, kind, durationMs });
  },

  markSeen(userId: string, storyIds: unknown): Promise<void> {
    if (!Array.isArray(storyIds) || !storyIds.every((id) => typeof id === 'string')) {
      throw new HttpError(400, 'storyIds must be an array of strings.');
    }
    return storiesRepository.markSeen(userId, storyIds);
  },
};

function toDto(row: StoryRow): StoryDto {
  return {
    id: row.id,
    mediaUrl: row.media_url,
    kind: row.kind as 'image' | 'video',
    durationMs: row.duration_ms,
    createdAt: row.created_at.toISOString(),
    seenByMe: row.seen_by_me,
  };
}
