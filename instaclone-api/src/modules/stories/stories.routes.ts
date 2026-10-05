import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { storiesController } from './stories.controller';

export const storiesRouter = Router();

// All three require auth: the tray is computed from *your* follow graph
// and *your* seen state, so there's no meaningful anonymous version of it.
storiesRouter.get('/stories/tray', requireAuth, asyncHandler(storiesController.tray));
storiesRouter.post('/stories', requireAuth, asyncHandler(storiesController.create));
storiesRouter.post('/stories/seen', requireAuth, asyncHandler(storiesController.markSeen));