import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LiveApi } from '../../../data-access/live/live.api';
import { LiveSession } from '../../../data-access/live/live.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-live-list',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-list.component.html',
  styleUrl: './live-list.component.scss',
})
export class LiveListComponent implements OnInit {
  private readonly api = inject(LiveApi);
  protected readonly sessions = signal<LiveSession[]>([]);

  async ngOnInit(): Promise<void> {
    this.sessions.set(await firstValueFrom(this.api.currentlyLive()));
  }
}
