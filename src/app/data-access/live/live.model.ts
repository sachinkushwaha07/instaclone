export interface LiveRoomToken {
  roomUrl: string;   // provider's connect URL (e.g. LiveKit websocket URL)
  token: string;      // short-lived JWT scoped to this room + role
  roomId: string;
}

export interface LiveSession {
  roomId: string;
  hostId: string;
  hostUsername: string;
  title: string;
  viewerCount: number;
  startedAt: string;
}