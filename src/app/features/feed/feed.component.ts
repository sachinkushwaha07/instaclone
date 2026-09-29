import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FeedStore } from './feed.store';
import { PostCardComponent } from './post-card/post-card.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.componnet';
import { InfiniteScrollDirective } from '../../shared/directives/infinite-scroll.directive';
import { StoryTrayComponent } from '../stories/story-tray/story-tray.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostCardComponent, SkeletonComponent, InfiniteScrollDirective, StoryTrayComponent],
  providers: [FeedStore], // scoped to this route: fresh feed per visit, freed on leave
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss',
})
export class FeedComponent implements OnInit {
  protected readonly store = inject(FeedStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.loadMore();
  }

  protected openPost(postId: string): void {
    this.router.navigate(['/p', postId]);
  }
}
