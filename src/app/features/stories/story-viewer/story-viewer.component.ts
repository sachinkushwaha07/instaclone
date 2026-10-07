import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StoriesApi } from '../../../data-access/stories/stories.api';
import { StoryGroup } from '../../../data-access/stories/story.model';

/**
 * Real build: progress bars driven by CSS animation (compositor thread,
 * stays smooth under load) rather than a JS interval per frame. Tap
 * left/right zones to go back/forward, long-press to pause. Preload the
 * next story's media as soon as the current one starts so transitions
 * feel instant. Collect seen IDs and flush via markSeen() every few
 * seconds instead of one request per story.
 */
@Component({
  selector: 'app-story-viewer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './story-viewer.component.html',
  styleUrl: './story-viewer.component.scss',
})
export class StoryViewerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(StoriesApi);

  protected readonly index = signal(0);
  protected readonly group = signal<StoryGroup | null>(null);
  private timer?: ReturnType<typeof setTimeout>;
  private seenIds = new Set<string>();

  protected readonly current = computed(() => this.group()?.stories[this.index()] ?? null);

  async ngOnInit(): Promise<void> {
    const userId = this.route.snapshot.paramMap.get('userId');
    const groups = await firstValueFrom(this.api.tray());
    this.group.set(groups.find((g) => g.user.id === userId) ?? null);
    // In a full implementation, an effect() here would (re)start the
    // per-story timer whenever `current()` changes, using story.durationMs.
  }

  next(): void {
    const stories = this.group()?.stories ?? [];
    if (this.current()) this.seenIds.add(this.current()!.id);
    if (this.index() < stories.length - 1) {
      this.index.update((i) => i + 1);
    } else {
      this.close();
    }
  }

  prev(): void {
    this.index.update((i) => Math.max(0, i - 1));
  }

  close(): void {
    if (this.seenIds.size) firstValueFrom(this.api.markSeen([...this.seenIds]));
    this.router.navigateByUrl('/');
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
