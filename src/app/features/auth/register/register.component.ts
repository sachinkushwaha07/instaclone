import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { ApiError } from '../../../core/http/error.interceptor';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

/** Group-level validator: the two password fields must match. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      displayName: ['', [Validators.required, Validators.maxLength(60)]],
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._]{3,30}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  /** Show a field's error only after the user has touched it. */
  protected showError(name: 'email' | 'displayName' | 'username' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.serverError.set(null);
    try {
      const { confirmPassword, ...payload } = this.form.getRawValue();
      void confirmPassword; // only used for client-side matching, never sent
      await this.auth.register(payload);
      this.router.navigateByUrl('/');
    } catch (e) {
      const error = e as ApiError;
      this.serverError.set(
        error.status === 503
          ? 'Sign-up is temporarily unavailable. Please try again shortly.'
          : error.message ?? 'Could not create your account.'
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
