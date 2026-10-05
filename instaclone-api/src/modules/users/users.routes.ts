import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware';
import { usersController } from './users.controller';

export const usersRouter = Router();

usersRouter.get('/users/search', optionalAuth, asyncHandler(usersController.search));
usersRouter.get('/users/by-username/:username', optionalAuth, asyncHandler(usersController.byUsername));
usersRouter.post('/users/:username/follow', requireAuth, asyncHandler(usersController.follow));
usersRouter.delete('/users/:username/follow', requireAuth, asyncHandler(usersController.unfollow));