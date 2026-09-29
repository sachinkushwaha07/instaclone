import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { AuthStore } from '../../core/auth/auth.store';
import { NotificationsStore } from '../../features/notifications/notifications.store';
import { AvatarComponent } from '../../shared/ui/avatar/avatar.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, AvatarComponent, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly notifications = inject(NotificationsStore);
  protected readonly faBell = faBell;
}
