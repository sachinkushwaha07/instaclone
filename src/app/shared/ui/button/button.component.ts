import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

@Component({
  selector: 'ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly clicked = output<MouseEvent>();
}
