import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  rememberMe = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.logout().subscribe({
      error: () => {}
    });
  }

  login(): void {
    this.errorMessage = '';
    this.authService.logout().pipe(
      catchError(() => of(null)),
      switchMap(() => this.authService.login(this.username, this.password, this.rememberMe))
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.errorMessage = 'Invalid username or password.';
      }
    });
  }
}
