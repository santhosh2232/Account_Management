import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { User, LoginRequest, AuthResponse } from '../models/user.model';

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true;
    // exp is in seconds
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = 'http://localhost:3000/api';
  private sessionTimeout: any;
  private readonly SESSION_TIMEOUT_MINUTES = 2 * 60; // 2 hours in minutes

  constructor(private http: HttpClient) {
    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('currentUser');
    if (isTokenExpired(token)) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('currentUser');
    }
    this.currentUserSubject = new BehaviorSubject<User | null>(
      user && !isTokenExpired(token) ? JSON.parse(user) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Add event listeners for browser close/tab close
    this.setupSessionCleanup();
    
    // Start session timeout if user is logged in
    if (this.currentUserValue) {
      this.startSessionTimeout();
    }
  }

  private setupSessionCleanup(): void {
    // Handle browser/tab close
    window.addEventListener('beforeunload', () => {
      this.clearSession();
    });

    // Handle page unload (when navigating away)
    window.addEventListener('unload', () => {
      this.clearSession();
    });

    // Handle page visibility change (when user switches tabs or minimizes)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Set a flag to track when page becomes hidden
        sessionStorage.setItem('pageHidden', Date.now().toString());
      } else {
        // Check if page was hidden for too long (optional security measure)
        const hiddenTime = sessionStorage.getItem('pageHidden');
        if (hiddenTime) {
          const hiddenDuration = Date.now() - parseInt(hiddenTime);
          const maxHiddenTime = 30 * 60 * 1000; // 30 minutes
          if (hiddenDuration > maxHiddenTime) {
            this.clearSession();
          }
          sessionStorage.removeItem('pageHidden');
        }
      }
    });

    // Handle storage events (if user opens multiple tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' && event.newValue === null) {
        this.currentUserSubject.next(null);
      }
    });

    // Handle focus events to reset session timeout
    window.addEventListener('focus', () => {
      if (this.currentUserValue) {
        this.resetSessionTimeout();
      }
    });
  }

  private startSessionTimeout(): void {
    this.resetSessionTimeout();
  }

  private resetSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Set timeout for session expiration
    this.sessionTimeout = setTimeout(() => {
      this.clearSession();
    }, this.SESSION_TIMEOUT_MINUTES * 60 * 1000);
  }

  private clearSession(): void {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('pageHidden');
    this.currentUserSubject.next(null);
    
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginRequest)
      .pipe(map(response => {
        // store user details and jwt token in session storage
        sessionStorage.setItem('currentUser', JSON.stringify(response.user));
        sessionStorage.setItem('token', response.token);
        this.currentUserSubject.next(response.user);
        
        // Start session timeout
        this.startSessionTimeout();
        
        return response;
      }));
  }

  logout() {
    // Call backend logout endpoint
    const token = sessionStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).subscribe({
        next: () => {
          // Logout successful
        },
        error: (error) => {
          console.error('Error logging out from server:', error);
        }
      });
    }
    
    // remove user from session storage and set current user to null
    this.clearSession();
  }

  isAuthenticated(): boolean {
    const token = sessionStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      this.clearSession();
      return false;
    }
    return !!this.currentUserValue;
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  getToken(): string | null {
    const token = sessionStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      this.clearSession();
      return null;
    }
    return token;
  }

  register(registerRequest: Partial<User>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerRequest)
      .pipe(map(response => {
        sessionStorage.setItem('currentUser', JSON.stringify(response.user));
        sessionStorage.setItem('token', response.token);
        this.currentUserSubject.next(response.user);
        
        // Start session timeout
        this.startSessionTimeout();
        
        return response;
      }));
  }

  forgotPassword(identifier: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { identifier, newPassword });
  }
} 