import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { chatController } from './chat.controller';

export const chatRouter = Router();
chatRouter.get('/conversations', requireAuth, asyncHandler(chatController.list));
chatRouter.post('/conversations', requireAuth, asyncHandler(chatController.create));
chatRouter.get('/conversations/:conversationId/messages', requireAuth, asyncHandler(chatController.messages));
chatRouter.post('/conversations/:conversationId/messages', requireAuth, asyncHandler(chatController.send));
