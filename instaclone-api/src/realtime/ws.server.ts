import { IncomingMessage } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyAccessToken } from '../utils/tokens';

interface SocketMessage<T = unknown> {
  type: string;
  payload: T;
}

/**
 * One entry per connected user, holding every socket they have open (a
 * phone and a laptop tab both connected counts as two). A Set, not a
 * single socket, is what lets `broadcastToUser` reach every device a
 * person is logged in on.
 */
const userSockets = new Map<string, Set<WebSocket>>();

function addSocket(userId: string, ws: WebSocket): void {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId)!.add(ws);
}

function removeSocket(userId: string, ws: WebSocket): void {
  const set = userSockets.get(userId);
  set?.delete(ws);
  if (set && set.size === 0) userSockets.delete(userId);
}

/** Used by other modules (e.g. postsService after a like) to push a live
 * event to one specific user — this is what makes the Angular
 * NotificationsStore's badge update without a page refresh. */
export function broadcastToUser(userId: string, message: SocketMessage): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const data = JSON.stringify(message);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

/** Same idea, but every viewer of a live room — used for live chat and
 * viewer-count updates. Rooms are just a naming convention on top of the
 * same per-user socket map (see joinRoom/leaveRoom below). */
const rooms = new Map<string, Set<WebSocket>>();

export function broadcastToRoom(roomId: string, message: SocketMessage, exclude?: WebSocket): void {
  const sockets = rooms.get(roomId);
  if (!sockets) return;
  const data = JSON.stringify(message);
  for (const ws of sockets) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

export function attachWebSocketServer(server: import('node:http').Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Auth over WebSocket has no Authorization header, so the access
    // token travels as a query param on the upgrade request instead:
    // wss://host/ws?token=<accessToken>. Same token, same short lifetime
    // as REST — a connection made just before expiry is simply refused,
    // and the Angular WebSocketService's reconnect logic (with backoff)
    // retries with a freshly refreshed token automatically.
    const url = new URL(req.url ?? '', 'http://localhost');
    const token = url.searchParams.get('token');

    let userId: string;
    try {
      if (!token) throw new Error('missing token');
      userId = verifyAccessToken(token).sub;
    } catch {
      ws.close(4001, 'Unauthorized');
      return;
    }

    addSocket(userId, ws);
    let currentRoom: string | null = null;

    ws.on('message', (raw) => {
      let msg: SocketMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return; // ignore malformed frames rather than crash the connection
      }

      switch (msg.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', payload: null }));
          break;

        case 'join-room': {
          const roomId = (msg.payload as { roomId: string }).roomId;
          currentRoom = roomId;
          if (!rooms.has(roomId)) rooms.set(roomId, new Set());
          rooms.get(roomId)!.add(ws);
          break;
        }

        case 'live-chat': {
          const { roomId, text } = msg.payload as { roomId: string; text: string };
          // Re-broadcast to the room, tagged with the sender — never trust
          // a client-supplied username, always attach it server-side.
          broadcastToRoom(roomId, { type: 'live-chat', payload: { username: userId, text } });
          break;
        }

        case 'message': {
          // A real implementation would persist this via chat.service and
          // then broadcastToUser() each participant. Left as a hook here.
          break;
        }

        default:
          break;
      }
    });

    ws.on('close', () => {
      removeSocket(userId, ws);
      if (currentRoom) rooms.get(currentRoom)?.delete(ws);
    });
  });

  return wss;
}