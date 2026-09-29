import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { StoriesApi } from '../../../data-access/stories/stories.api';
import { StoryGroup } from '../../../data-access/stories/story.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-story-tray',
  standalone: true,
  imports: [AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './story-tray.component.html',
  styleUrl: './story-tray.component.scss',
})
export class StoryTrayComponent implements OnInit {
  private readonly api = inject(StoriesApi);
  private readonly router = inject(Router);

  protected readonly groups = signal<StoryGroup[]>([]);

  async ngOnInit(): Promise<void> {
    this.groups.set(await firstValueFrom(this.api.tray()));
  }

  protected openStory(userId: string): void {
    this.router.navigate(['/stories', userId]);
  }
}
