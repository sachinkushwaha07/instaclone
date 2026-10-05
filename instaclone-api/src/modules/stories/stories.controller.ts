import { Request, Response } from 'express';
import { storiesService } from './stories.service';

export const storiesController = {
  async tray(req: Request, res: Response): Promise<void> {
    const groups = await storiesService.tray(req.userId!);
    res.json(groups);
  },

  async create(req: Request, res: Response): Promise<void> {
    const { mediaKey, kind } = req.body as { mediaKey?: string; kind?: 'image' | 'video' };
    await storiesService.create(req.userId!, mediaKey ?? '', kind ?? 'image');
    res.status(201).send();
  },

  async markSeen(req: Request, res: Response): Promise<void> {
    const { storyIds } = req.body as { storyIds?: unknown };
    await storiesService.markSeen(req.userId!, storyIds);
    res.status(204).send();
  },
};