import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { mediaRouter, mediaUploadsDirectory } from './modules/media/media.routes';
import { postsRouter } from './modules/posts/posts.routes';
import { storiesRouter } from './modules/stories/stories.routes';
import { usersRouter } from './modules/users/users.routes';

export function createApp(): Express {
  const app = express();

  // Express sits behind Nginx in production (see nginx/instaclone.conf),
  // which terminates TLS and forwards X-Forwarded-*. Trusting the proxy is
  // what makes req.ip and the `secure` cookie flag correct instead of
  // always seeing Nginx's own local address.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN, // the Angular dev server / production origin, not '*'
      credentials: true, // required for the refresh-token cookie to be sent/received
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // A coarse, API-wide ceiling. Sensitive endpoints (login/register) have
  // their own tighter limiter — see auth.routes.ts.
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter);
  app.use('/api/media/files', express.static(mediaUploadsDirectory));
  app.use('/api', mediaRouter);
  app.use('/api', postsRouter);
  app.use('/api', usersRouter);
  app.use('/api', notificationsRouter);
  app.use('/api', storiesRouter);

  // Must be registered last: Express only routes to an error handler
  // when it's the final middleware with a 4-argument signature.
  app.use(errorHandler);

  return app;
}
