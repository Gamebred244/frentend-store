import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  username: string;
  role: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  signup(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth/signup`,
      { username, email, password },
      { withCredentials: true }
    ).pipe(
      tap((user) => {
        localStorage.removeItem('cartId');
        this.currentUserSubject.next(user);
      })
    );
  }

  login(username: string, password: string, rememberMe: boolean): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth/login`,
      { username, password, rememberMe },
      { withCredentials: true }
    ).pipe(
      tap((user) => {
        localStorage.removeItem('cartId');
        this.currentUserSubject.next(user);
      })
    );
  }

  me(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/me`, { withCredentials: true }).pipe(
      tap((user) => this.currentUserSubject.next(user))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        localStorage.removeItem('cartId');
        this.currentUserSubject.next(null);
      })
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/forgot`, { email }, { withCredentials: true });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/reset`, { token, newPassword }, { withCredentials: true });
  }

  clearUser(): void {
    this.currentUserSubject.next(null);
  }
}
