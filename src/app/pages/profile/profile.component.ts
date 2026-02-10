import { Component, OnInit } from '@angular/core';
import { AuthResponse, AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: AuthResponse | null = null;
  statusKey: string | null = 'PROFILE.STATUS.LOADING';

  constructor(private authService: AuthService, private languageService: LanguageService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.authService.me().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.statusKey = '';
      },
      error: () => {
        this.currentUser = null;
        this.statusKey = 'PROFILE.STATUS.NEED_SIGNIN';
      }
    });
  }

  changeLanguage(lang: string): void {
    this.languageService.setLanguage(lang);
  }
}
