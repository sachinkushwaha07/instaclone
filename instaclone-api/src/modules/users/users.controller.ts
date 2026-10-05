import { Request, Response } from 'express';
import { usersService } from './users.service';

export const usersController = {
  async byUsername(req: Request, res: Response): Promise<void> {
    const user = await usersService.byUsername(req.params.username, req.userId ?? null);
    res.json(user);
  },
  async follow(req: Request, res: Response): Promise<void> {
    await usersService.follow(req.userId!, req.params.username);
    res.status(204).send();
  },
  async unfollow(req: Request, res: Response): Promise<void> {
    await usersService.unfollow(req.userId!, req.params.username);
    res.status(204).send();
  },
  async search(req: Request, res: Response): Promise<void> {
    const results = await usersService.search((req.query.q as string) ?? '', req.userId ?? null);
    res.json(results);
  },
};