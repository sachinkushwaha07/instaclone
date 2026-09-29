import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.login(this.form.getRawValue());
      this.router.navigateByUrl('/');
    } catch {
      this.errorMessage.set('Sorry, your password was incorrect.');
    } finally {
      this.submitting.set(false);
    }
  }
}

