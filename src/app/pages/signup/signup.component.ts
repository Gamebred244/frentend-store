import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  username = '';
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.logout().subscribe({
      error: () => {}
    });
  }

  signup(): void {
    this.errorMessage = '';
    this.authService.logout().pipe(
      catchError(() => of(null)),
      switchMap(() => this.authService.signup(this.username, this.email, this.password))
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Unable to create account.';
      }
    });
  }
}
