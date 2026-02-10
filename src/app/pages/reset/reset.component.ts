import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
export class ResetComponent {
  token = '';
  newPassword = '';
  statusText = '';
  errorText = '';

  constructor(private authService: AuthService, private route: ActivatedRoute, private router: Router) {
    this.route.queryParamMap.subscribe((params) => {
      this.token = params.get('token') || '';
    });
  }

  submit(): void {
    this.statusText = '';
    this.errorText = '';
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.statusText = 'Password updated. Please sign in.';
        setTimeout(() => this.router.navigateByUrl('/login'), 800);
      },
      error: (error) => {
        this.errorText = error?.error?.message || 'Unable to reset password.';
      }
    });
  }
}
