export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  followedByMe: boolean;
  isLive: boolean;
}