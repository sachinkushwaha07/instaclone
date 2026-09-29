import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PostsApi } from '../../data-access/posts/posts.api';
import { Post } from '../../data-access/posts/post.model';
import { PostCardComponent } from '../feed/post-card/post-card.component';

// SSR renders this route server-side so a shared post link gets a real
// <title>/OG tags for link previews, rather than a blank shell.
@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [PostCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './post-detail.component.html',
})
export class PostDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PostsApi);

  protected readonly post = signal<Post | null>(null);

  async ngOnInit(): Promise<void> {
    const postId = this.route.snapshot.paramMap.get('postId');
    if (postId) this.post.set(await firstValueFrom(this.api.get(postId)));
  }

  onLike(postId: string): void {
    firstValueFrom(this.api.like(postId));
  }
}
