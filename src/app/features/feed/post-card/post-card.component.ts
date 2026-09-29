import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faComment, faHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { TimeAgoPipe } from '../../../shared/utils/time-ago.pipe';
import { Post } from '../../../data-access/posts/post.model';

/**
 * Pure presentational component: takes a Post in, emits user intent out.
 * It never calls the API or a store directly, which is what lets the same
 * card be reused in the feed, a profile grid, and the post-detail page.
 */
@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [NgOptimizedImage, AvatarComponent, TimeAgoPipe, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
  readonly post = input.required<Post>();
  readonly like = output<string>();
  readonly openComments = output<string>();
  protected readonly faComment = faComment;
  protected readonly faHeart = faHeart;
  protected readonly faHeartRegular = faHeartRegular;
}
