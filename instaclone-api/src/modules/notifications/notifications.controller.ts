import { Request, Response } from 'express';
import { notificationsService } from './notifications.service';

export const notificationsController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await notificationsService.list(req.userId!, req.query.cursor as string | undefined);
    res.json(result);
  },
  async markAllRead(req: Request, res: Response): Promise<void> {
    await notificationsService.markAllRead(req.userId!);
    res.status(204).send();
  },
};