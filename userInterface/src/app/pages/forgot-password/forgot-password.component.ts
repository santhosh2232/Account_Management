import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.forgotPasswordForm = this.fb.group({
      identifier: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) return;
    this.loading = true;
    this.error = null;
    this.success = null;
    const { identifier, newPassword } = this.forgotPasswordForm.value;
    // Exclude confirmPassword from the request
    this.authService.forgotPassword(identifier, newPassword).subscribe({
      next: (res) => {
        this.success = res.message || 'Password reset successful!';
        this.loading = false;
        this.forgotPasswordForm.reset();
      },
      error: (err) => {
        this.error = err.error?.message || 'Password reset failed.';
        this.loading = false;
      }
    });
  }
} 