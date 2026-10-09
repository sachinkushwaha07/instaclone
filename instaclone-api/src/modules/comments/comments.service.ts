import { HttpError } from '../../middleware/error.middleware';
import { commentsRepository, CommentRow } from './comments.repository';

function toDto(row: CommentRow) {
  return {
    id: row.id,
    postId: row.post_id,
    text: row.text,
    createdAt: row.created_at.toISOString(),
    author: { id: row.author_id, username: row.author_username, avatarUrl: row.author_avatar_url },
  };
}

export const commentsService = {
  async list(postId: string) {
    return (await commentsRepository.list(postId)).map(toDto);
  },

  async create(postId: string, authorId: string, rawText: unknown) {
    if (typeof rawText !== 'string' || !rawText.trim() || rawText.trim().length > 1000) {
      throw new HttpError(400, 'A comment must contain 1 to 1,000 characters.');
    }
    if (!(await commentsRepository.postAuthor(postId))) throw new HttpError(404, 'Post not found.');
    return toDto(await commentsRepository.create(postId, authorId, rawText.trim()));
  },
};
