import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { NotificationsStore } from './notifications.store';
import { InfiniteScrollDirective } from '../../shared/directives/infinite-scroll.directive';
import { TimeAgoPipe } from '../../shared/utils/time-ago.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [InfiniteScrollDirective, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  protected readonly store = inject(NotificationsStore);
  ngOnInit(): void {
    setTimeout(() => this.store.markAllRead(), 1500);
  }
}
