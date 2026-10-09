import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware';
import { commentsController } from './comments.controller';

export const commentsRouter = Router();
commentsRouter.get('/posts/:postId/comments', optionalAuth, asyncHandler(commentsController.list));
commentsRouter.post('/posts/:postId/comments', requireAuth, asyncHandler(commentsController.create));
