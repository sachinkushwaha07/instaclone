import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton.componnet.html',
  styleUrl: './skeleton.componnet.scss',
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('16px');
  readonly radius = input('4px');
}
