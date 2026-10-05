import { Request, Response } from 'express';
import { HttpError } from '../../middleware/error.middleware';
import { postsService } from './posts.service';

export const postsController = {
  async feed(req: Request, res: Response): Promise<void> {
    const result = await postsService.feed(req.query.cursor as string | undefined, req.query.limit, req.userId!);
    res.json(result);
  },

  async byUser(req: Request, res: Response): Promise<void> {
    const result = await postsService.byAuthor(
      req.params.userId,
      req.query.cursor as string | undefined,
      req.query.limit,
      req.userId ?? null
    );
    res.json(result);
  },

  async get(req: Request, res: Response): Promise<void> {
    const post = await postsService.get(req.params.postId, req.userId ?? null);
    res.json(post);
  },

  async create(req: Request, res: Response): Promise<void> {
    const { mediaKeys, caption } = req.body as { mediaKeys?: string[]; caption?: string };
    if (!Array.isArray(mediaKeys) || mediaKeys.length === 0) {
      throw new HttpError(400, 'At least one media item is required.');
    }
    const post = await postsService.create(req.userId!, caption ?? '', mediaKeys);
    res.status(201).json(post);
  },

  async like(req: Request, res: Response): Promise<void> {
    await postsService.like(req.userId!, req.params.postId);
    res.status(204).send();
  },

  async unlike(req: Request, res: Response): Promise<void> {
    await postsService.unlike(req.userId!, req.params.postId);
    res.status(204).send();
  },
};