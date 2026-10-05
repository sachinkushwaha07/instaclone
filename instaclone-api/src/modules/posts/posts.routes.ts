import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware';
import { postsController } from './posts.controller';

export const postsRouter = Router();

// GET routes use optionalAuth: a logged-out visitor could still view a
// public feed/profile (likedByMe just comes back false), while POST routes
// that mutate state require a real, verified user.
postsRouter.get('/feed', requireAuth, asyncHandler(postsController.feed));
postsRouter.get('/posts/:postId', optionalAuth, asyncHandler(postsController.get));
postsRouter.post('/posts', requireAuth, asyncHandler(postsController.create));
postsRouter.post('/posts/:postId/like', requireAuth, asyncHandler(postsController.like));
postsRouter.delete('/posts/:postId/like', requireAuth, asyncHandler(postsController.unlike));
postsRouter.get('/users/:userId/posts', optionalAuth, asyncHandler(postsController.byUser));