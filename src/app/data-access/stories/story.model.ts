export interface Story {
  id: string;
  mediaUrl: string;
  kind: 'image' | 'video';
  durationMs: number; // 5000 for images; actual clip length for video
  createdAt: string;
  seenByMe: boolean;
}

/** One tray entry = one user's stack of stories. `hasUnseen` drives the
 * gradient ring in the tray, computed client-side from the stories list. */
export interface StoryGroup {
  user: { id: string; username: string; avatarUrl: string | null };
  stories: Story[];
  hasUnseen: boolean;
}