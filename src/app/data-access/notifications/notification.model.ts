export type NotificationType = 'like' | 'comment' | 'follow' | 'live_started' | 'mention';

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorUsername: string;
  actorAvatarUrl: string | null;
  postThumbUrl?: string;
  createdAt: string;
  read: boolean;
}