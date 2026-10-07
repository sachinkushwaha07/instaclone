import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHouse, faMagnifyingGlass, faPlusSquare, faRightFromBracket, faVideo } from '@fortawesome/free-solid-svg-icons';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly faHouse = faHouse;
  protected readonly faMagnifyingGlass = faMagnifyingGlass;
  protected readonly faPlusSquare = faPlusSquare;
  protected readonly faVideo = faVideo;
  protected readonly faRightFromBracket = faRightFromBracket;

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
