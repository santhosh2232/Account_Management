import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { User, LoginRequest, AuthResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

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
  private apiUrl = environment.apiBaseUrl;
  private sessionTimeout: any;
  private readonly SESSION_TIMEOUT_MINUTES = 2 * 60; // 2 hours in minutes

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser');
    if (isTokenExpired(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject = new BehaviorSubject<User | null>(
      user && !isTokenExpired(token) ? JSON.parse(user) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    this.setupSessionCleanup();
    if (this.currentUserValue) {
      this.startSessionTimeout();
    }
  }

  private setupSessionCleanup(): void {
    // Handle browser/tab close
    window.addEventListener('beforeunload', () => {
      // Don't clear localStorage on page unload to maintain login state
    });

    // Handle page visibility change (when user switches tabs or minimizes)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Set a flag to track when page becomes hidden
        localStorage.setItem('pageHidden', Date.now().toString());
      } else {
        // Check if page was hidden for too long (optional security measure)
        const hiddenTime = localStorage.getItem('pageHidden');
        if (hiddenTime) {
          const hiddenDuration = Date.now() - parseInt(hiddenTime);
          const maxHiddenTime = 30 * 60 * 1000; // 30 minutes
          if (hiddenDuration > maxHiddenTime) {
            this.clearSession();
          }
          localStorage.removeItem('pageHidden');
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
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('pageHidden');
    this.currentUserSubject.next(null);
    
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      this.clearSession();
      return null;
    }
    return token;
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginRequest)
      .pipe(map(response => {
        // store user details and jwt token in local storage
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(response.user);
        
        // Start session timeout
        this.startSessionTimeout();
        
        return response;
      }));
  }

  logout() {
    // Call backend logout endpoint
    const token = localStorage.getItem('token');
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
    
    // remove user from local storage and set current user to null
    this.clearSession();
  }

  register(registerRequest: Partial<User>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerRequest)
      .pipe(map(response => {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
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