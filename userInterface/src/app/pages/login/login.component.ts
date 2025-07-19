import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error = '';
  returnUrl: string = '/dashboard';

  // Forgot password state
  showForgotPassword = false;
  forgotPasswordForm: FormGroup;
  forgotLoading = false;
  forgotError: string | null = null;
  forgotSuccess: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.forgotPasswordForm = this.formBuilder.group({
      identifier: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const loginRequest: LoginRequest = this.loginForm.value;

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 100); // 100ms delay to ensure sessionStorage is set
      },
      error: (error) => {
        this.error = error.error?.message || 'Login failed. Please try again.';
        this.loading = false;
      }
    });
  }

  onForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) return;
    this.forgotLoading = true;
    this.forgotError = null;
    this.forgotSuccess = null;
    const { identifier, newPassword } = this.forgotPasswordForm.value;
    this.authService.forgotPassword(identifier, newPassword)
      .subscribe({
        next: (res) => {
          this.forgotSuccess = res.message || 'Password reset successful!';
          this.forgotLoading = false;
          this.forgotPasswordForm.reset();
        },
        error: (err) => {
          this.forgotError = err.error?.message || 'Password reset failed.';
          this.forgotLoading = false;
        }
      });
  }

  get f() {
    return this.loginForm.controls;
  }
} 