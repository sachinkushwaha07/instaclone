import { Request, Response } from 'express';
import { commentsService } from './comments.service';

export const commentsController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await commentsService.list(req.params.postId));
  },
  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await commentsService.create(req.params.postId, req.userId!, req.body?.text));
  },
};
