import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css']
})
export class ForgotComponent {
  email = '';
  statusText = '';
  errorText = '';

  constructor(private authService: AuthService) {}

  submit(): void {
    this.statusText = '';
    this.errorText = '';
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.statusText = 'If this email exists, a reset link was sent.';
      },
      error: (error) => {
        this.errorText = error?.error?.message || 'Unable to send reset email.';
      }
    });
  }
}
