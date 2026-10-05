import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { notificationsController } from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.get('/notifications', requireAuth, asyncHandler(notificationsController.list));
notificationsRouter.post('/notifications/read-all', requireAuth, asyncHandler(notificationsController.markAllRead));