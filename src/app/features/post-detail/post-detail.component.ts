import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PostsApi } from '../../data-access/posts/posts.api';
import { Post } from '../../data-access/posts/post.model';
import { PostCardComponent } from '../feed/post-card/post-card.component';
import { CommentsApi } from '../../data-access/comments/comments.api';
import { Comment } from '../../data-access/comments/comment.model';

// SSR renders this route server-side so a shared post link gets a real
// <title>/OG tags for link previews, rather than a blank shell.
@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, PostCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PostsApi);
  private readonly commentsApi = inject(CommentsApi);

  protected readonly post = signal<Post | null>(null);
  protected readonly comments = signal<Comment[]>([]);
  protected readonly commentError = signal<string | null>(null);
  protected readonly sendingComment = signal(false);
  protected commentText = '';

  async ngOnInit(): Promise<void> {
    const postId = this.route.snapshot.paramMap.get('postId');
    if (postId) {
      const [post, comments] = await Promise.all([
        firstValueFrom(this.api.get(postId)),
        firstValueFrom(this.commentsApi.list(postId)),
      ]);
      this.post.set(post);
      this.comments.set(comments);
    }
  }

  onLike(postId: string): void {
    firstValueFrom(this.api.like(postId));
  }

  async addComment(postId: string): Promise<void> {
    const text = this.commentText.trim();
    if (!text || this.sendingComment()) return;
    this.sendingComment.set(true);
    this.commentError.set(null);
    try {
      const comment = await firstValueFrom(this.commentsApi.create(postId, text));
      this.comments.update((comments) => [...comments, comment]);
      this.commentText = '';
    } catch {
      this.commentError.set('Your comment could not be posted. Please try again.');
    } finally {
      this.sendingComment.set(false);
    }
  }
}
