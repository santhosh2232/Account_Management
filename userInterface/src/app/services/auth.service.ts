import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
        return response;
      }));
  }

  logout() {
    // remove user from session storage and set current user to null
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = sessionStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      this.logout();
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
      this.logout();
      return null;
    }
    return token;
  }
} 