import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { WebSocketService } from '../../core/realtime/websocket.service';
import { NotificationsStore } from '../../features/notifications/notifications.store';

/**
 * Wraps every authenticated route with the navbar (desktop) and bottom
 * nav (mobile). Auth routes (login/register) render outside this shell
 * via a sibling top-level route, so they get the full screen.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, BottomNavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  constructor() {
    // One socket for the whole session; notifications, DMs and live events share it.
    inject(WebSocketService).connect('wss://realtime.example.com/events'); // replace with your gateway
    inject(NotificationsStore).loadMore();
  }
}
