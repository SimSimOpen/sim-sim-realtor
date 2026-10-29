import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthResponse, UserDetailsResponse } from '../shared/models/auth';
import { Observable } from 'rxjs';
import { AUTH_URL } from '../shared/constants/urls';

/** Roles that see the whole admin, matching the backend's `hasAnyAuthority('ADMIN','MANAGER')`. */
export const ADMIN_ROLES = ['ADMIN', 'MANAGER'];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  authenticate(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${AUTH_URL}/v1/authenticate`, {
      username,
      password,
    });
  }
  registerAgent(
    username: string,
    email: string,
    password: string,
    phoneNumber?: string,
  ): Observable<void> {
    return this.http.post<void>(`${AUTH_URL}/v1/register/agent`, {
      username,
      email,
      password,
      phoneNumber: phoneNumber || null,
    });
  }

  /**
   * Account fields of the signed-in user.
   */
  getUserData(): Observable<UserDetailsResponse> {
    return this.http.get<UserDetailsResponse>(`${AUTH_URL}/v1/details`);
  }

  isAuthenticated(): boolean {
    return !this.isTokenExpired();
  }

  /** True while the stored token exists and has not passed its `exp` claim. */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }
    const exp = this.decodeTokenPayload(token)?.['exp'];
    // No exp claim means a token we cannot date, so let the API be the judge instead of blocking.
    return typeof exp === 'number' ? exp * 1000 <= Date.now() : false;
  }

  /** Roles of the signed-in user as stored at login; empty for an anonymous or legacy session. */
  getRoles(): string[] {
    return this.getUserDataFromStorage()?.authorities ?? [];
  }

  hasAnyRole(roles: string[]): boolean {
    const owned = this.getRoles();
    return roles.some((role) => owned.includes(role));
  }

  /** ADMIN and MANAGER see every menu; AGENT sees its own products, reports, analytics, settings. */
  isAdminRole(): boolean {
    return this.hasAnyRole(ADMIN_ROLES);
  }

  private decodeTokenPayload(token: string): Record<string, unknown> | null {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    try {
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }

  storeToken(token: string) {
    sessionStorage.setItem('authToken', token);
  }

  getToken() {
    return sessionStorage.getItem('authToken');
  }

  setUsername(username: string) {
    sessionStorage.setItem('username', username);
  }

  getUsername() {
    return sessionStorage.getItem('username');
  }

  setUserData(user: Omit<AuthResponse, 'token' | 'refreshToken'>) {
    const { token, refreshToken, ...safeData } = user as AuthResponse;
    localStorage.setItem('userProfile', JSON.stringify(safeData));
  }
  getUserDataFromStorage(): Omit<AuthResponse, 'token' | 'refreshToken'> | null {
    const userData = localStorage.getItem('userProfile');
    return userData ? JSON.parse(userData) : null;
  }

  clearStorage() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    localStorage.removeItem('userProfile');
  }
}
