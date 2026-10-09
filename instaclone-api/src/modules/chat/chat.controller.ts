import { Request, Response } from 'express';
import { chatService } from './chat.service';

export const chatController = {
  async list(req: Request, res: Response): Promise<void> { res.json(await chatService.list(req.userId!)); },
  async create(req: Request, res: Response): Promise<void> { res.status(201).json(await chatService.create(req.userId!, req.body?.participantId)); },
  async messages(req: Request, res: Response): Promise<void> { res.json(await chatService.messages(req.userId!, req.params.conversationId)); },
  async send(req: Request, res: Response): Promise<void> { res.status(201).json(await chatService.send(req.userId!, req.params.conversationId, req.body?.text)); },
};
