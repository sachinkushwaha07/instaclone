import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsersApi } from '../../data-access/users/users.api';
import { PostsApi } from '../../data-access/posts/posts.api';
import { UserProfile } from '../../data-access/users/user.model';
import { AvatarComponent } from '../../shared/ui/avatar/avatar.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InfiniteScrollDirective } from '../../shared/directives/infinite-scroll.directive';
import { Post } from '../../data-access/posts/post.model';

/**
 * The post grid below reuses the same cursor-pagination + IntersectionObserver
 * pattern as FeedStore, as plain signals here since a profile's post list is
 * simpler (no optimistic like toggling at the thumbnail level — that happens
 * once a post is opened). For very large profiles, swap the @for for
 * cdk-virtual-scroll.
 *
 * `withComponentInputBinding()` (set in app.config.ts) would let the route's
 * :username param bind straight to an `input()` here; this version instead
 * subscribes to paramMap directly so a link from one profile to another
 * (same component instance reused by the router) reliably reloads data.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, AvatarComponent, ButtonComponent, InfiniteScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usersApi = inject(UsersApi);
  private readonly postsApi = inject(PostsApi);

  protected readonly user = signal<UserProfile | null>(null);
  protected readonly posts = signal<Post[]>([]);
  protected readonly loading = signal(false);
  protected readonly hasMore = signal(true);
  protected readonly followPending = signal(false);
  private cursor: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const username = params.get('username');
      if (username) this.loadProfile(username);
    });
  }

  private async loadProfile(username: string): Promise<void> {
    const user = await firstValueFrom(this.usersApi.byUsername(username));
    this.user.set(user);
    this.posts.set([]);
    this.cursor = null;
    this.hasMore.set(true);
    await this.loadMorePosts(user.id);
  }

  async loadMorePosts(userId: string): Promise<void> {
    if (this.loading() || !this.hasMore()) return;
    this.loading.set(true);
    const page = await firstValueFrom(this.postsApi.byUser(userId, this.cursor));
    this.posts.update((list) => [...list, ...page.items]);
    this.cursor = page.nextCursor;
    this.hasMore.set(page.nextCursor !== null);
    this.loading.set(false);
  }

  async toggleFollow(user: UserProfile): Promise<void> {
    if (this.followPending()) return;
    this.followPending.set(true);
    const next = !user.followedByMe;
    try {
      // The API identifies follow targets by username, not the database id.
      await firstValueFrom(next ? this.usersApi.follow(user.username) : this.usersApi.unfollow(user.username));
      this.user.update((u) =>
        u
          ? { ...u, followedByMe: next, followerCount: Math.max(0, u.followerCount + (next ? 1 : -1)) }
          : u
      );
    } finally {
      this.followPending.set(false);
    }
  }
}
