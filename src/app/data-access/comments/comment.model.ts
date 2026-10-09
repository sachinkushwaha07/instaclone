export interface Comment {
  id: string;
  postId: string;
  text: string;
  createdAt: string;
  author: { id: string; username: string; avatarUrl: string | null };
}
