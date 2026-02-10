import { Component, OnInit } from '@angular/core';
import { AuthResponse, AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: AuthResponse | null = null;
  statusText = 'Loading profile...';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.authService.me().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.statusText = '';
      },
      error: () => {
        this.currentUser = null;
        this.statusText = 'Please sign in to view your profile.';
      }
    });
  }
}
