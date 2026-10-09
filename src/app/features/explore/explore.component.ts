import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsersApi } from '../../data-access/users/users.api';
import { UserProfile } from '../../data-access/users/user.model';
import { AvatarComponent } from '../../shared/ui/avatar/avatar.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [FormsModule, RouterLink, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss',
})
export class ExploreComponent {
  private readonly usersApi = inject(UsersApi);
  protected readonly results = signal<UserProfile[]>([]);
  protected readonly loading = signal(false);
  protected readonly searched = signal(false);
  protected query = '';

  async search(): Promise<void> {
    const query = this.query.trim();
    if (!query) {
      this.results.set([]);
      this.searched.set(false);
      return;
    }
    this.loading.set(true);
    this.searched.set(true);
    try {
      this.results.set(await firstValueFrom(this.usersApi.search(query)));
    } finally {
      this.loading.set(false);
    }
  }
}
