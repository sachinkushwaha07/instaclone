export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: CurrentUser;
}

export interface LoginPayload {
  identifier: string; // email or username
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  displayName: string;
  password: string;
}