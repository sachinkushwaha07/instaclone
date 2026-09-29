import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { PostsApi } from '../../data-access/posts/posts.api';
import { Post } from '../../data-access/posts/post.model';

interface FeedState {
  posts: Post[];
  cursor: string | null;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
}

const initialState: FeedState = {
  posts: [],
  cursor: null,
  loading: false,
  hasMore: true,
  error: null,
};

/**
 * Feature-scoped store (not providedIn: 'root') so a fresh feed loads each
 * time the /feed route is entered, and memory is released when it's left.
 * Provide it in the route's providers, not in app.config.
 */
export const FeedStore = signalStore(
  withState(initialState),
  withMethods((store, api = inject(PostsApi)) => ({
    async loadMore(): Promise<void> {
      if (store.loading() || !store.hasMore()) return;
      patchState(store, { loading: true, error: null });
      try {
        const page = await firstValueFrom(api.feed(store.cursor()));
        patchState(store, (s) => ({
          posts: [...s.posts, ...page.items],
          cursor: page.nextCursor,
          hasMore: page.nextCursor !== null,
          loading: false,
        }));
      } catch {
        patchState(store, { loading: false, error: 'Could not load the feed. Pull to retry.' });
      }
    },

    /** Optimistic: flip the UI instantly, call the API, roll back on
     * failure. A social feed must feel instant on every tap. */
    async toggleLike(postId: string): Promise<void> {
      const target = store.posts().find((p) => p.id === postId);
      if (!target) return;

      const wasLiked = target.likedByMe;
      this.patchPost(postId, {
        likedByMe: !wasLiked,
        likeCount: target.likeCount + (wasLiked ? -1 : 1),
      });

      try {
        await firstValueFrom(wasLiked ? api.unlike(postId) : api.like(postId));
      } catch {
        this.patchPost(postId, { likedByMe: wasLiked, likeCount: target.likeCount });
      }
    },

    patchPost(postId: string, changes: Partial<Post>): void {
      patchState(store, (s) => ({
        posts: s.posts.map((p) => (p.id === postId ? { ...p, ...changes } : p)),
      }));
    },

    reset(): void {
      patchState(store, initialState);
    },
  }))
);