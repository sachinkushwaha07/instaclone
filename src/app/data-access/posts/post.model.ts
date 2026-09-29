export interface PostAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface MediaAsset {
  id: string;
  kind: 'image' | 'video';
  thumbUrl: string;
  fullUrl: string;
  hlsUrl?: string; // present once video transcoding finishes
  width: number;
  height: number;
}

export interface Post {
  id: string;
  author: PostAuthor;
  caption: string;
  media: MediaAsset[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  createdAt: string;
}