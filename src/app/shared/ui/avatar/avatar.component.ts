import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  readonly src = input<string | null>(null);
  readonly alt = input<string>('');
  readonly size = input<number>(40);
  readonly ring = input<boolean>(false); // true = "has unseen story"
  readonly initials = input<string>('?');
}
