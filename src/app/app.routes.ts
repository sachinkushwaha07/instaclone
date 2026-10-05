import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.gaurd';

export const routes: Routes = [
  // Auth routes render full-screen, outside the shell (no navbar/bottom-nav).
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent) },
    ],
  },

  // Everything below requires auth and renders inside the shell (navbar + bottom nav).
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', loadComponent: () => import('./features/feed/feed.component').then((m) => m.FeedComponent) },
      { path: 'explore', loadComponent: () => import('./features/explore/explore.component').then((m) => m.ExploreComponent) },
      { path: 'create', loadComponent: () => import('./features/create-post/create-post.component').then((m) => m.CreatePostComponent) },
      { path: 'stories/create', loadComponent: () => import('./features/stories/create-story/create-story.component').then((m) => m.CreateStoryComponent) },
      { path: 'p/:postId', loadComponent: () => import('./features/post-detail/post-detail.component').then((m) => m.PostDetailComponent) },
      { path: 'stories/:userId', loadComponent: () => import('./features/stories/story-viewer/story-viewer.component').then((m) => m.StoryViewerComponent) },
      { path: 'live', loadComponent: () => import('./features/live/live-list/live-list.component').then((m) => m.LiveListComponent) },
      { path: 'live/:roomId', loadComponent: () => import('./features/live/live-room/live-room.component').then((m) => m.LiveRoomComponent) },
      { path: 'go-live', loadComponent: () => import('./features/live/broadcaster/broadcaster.component').then((m) => m.BroadcasterComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent) },
      { path: 'messages', loadComponent: () => import('./features/messages/messages.component').then((m) => m.MessagesComponent) },
      { path: 'profile/:username', loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent) },
    ],
  },

  { path: '**', redirectTo: '' },
];
