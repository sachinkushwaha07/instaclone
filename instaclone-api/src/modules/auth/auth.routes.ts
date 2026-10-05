import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../middleware/error.middleware';
import { authController } from './auth.controller';

export const authRouter = Router();

// Login/register are the most brute-forceable endpoints in the app, so
// they get a tighter limit than the general API-wide one in app.ts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again later.' },
});

authRouter.post('/register', authLimiter, asyncHandler(authController.register));
authRouter.post('/login', authLimiter, asyncHandler(authController.login));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));