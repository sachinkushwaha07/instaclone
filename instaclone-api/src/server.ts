import http from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { attachWebSocketServer } from './realtime/ws.server';

const app = createApp();

// A plain Node http.Server, not app.listen() directly, because the
// WebSocket server needs to attach to the same underlying server and
// intercept the HTTP -> WebSocket upgrade handshake on one shared port.
const server = http.createServer(app);
attachWebSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`instaclone-api listening on :${env.PORT} (${env.NODE_ENV})`);
});

// Let in-flight requests finish instead of dropping them when the process
// is asked to stop (e.g. a container orchestrator rolling out a new version).
function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));