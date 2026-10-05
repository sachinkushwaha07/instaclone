import { HttpError } from '../../middleware/error.middleware';
import { UserProfileRow, usersRepository } from './users.repository';

export interface UserProfileDto {
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

function toDto(row: UserProfileRow): UserProfileDto {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    followerCount: row.follower_count,
    followingCount: row.following_count,
    postCount: row.post_count,
    followedByMe: row.followed_by_me,
    isLive: false,
  };
}

export const usersService = {
  async byUsername(username: string, viewerId: string | null): Promise<UserProfileDto> {
    const row = await usersRepository.byUsername(username, viewerId);
    if (!row) throw new HttpError(404, 'User not found.');
    return toDto(row);
  },

  async follow(followerId: string, targetUsername: string): Promise<void> {
    const targetId = await usersRepository.idByUsername(targetUsername);
    if (!targetId) throw new HttpError(404, 'User not found.');
    await usersRepository.follow(followerId, targetId);
  },

  async unfollow(followerId: string, targetUsername: string): Promise<void> {
    const targetId = await usersRepository.idByUsername(targetUsername);
    if (!targetId) throw new HttpError(404, 'User not found.');
    await usersRepository.unfollow(followerId, targetId);
  },

  async search(query: string, viewerId: string | null): Promise<UserProfileDto[]> {
    if (!query.trim()) return [];
    const rows = await usersRepository.search(query.trim(), viewerId);
    return rows.map(toDto);
  },
};