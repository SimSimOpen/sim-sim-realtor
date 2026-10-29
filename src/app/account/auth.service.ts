import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthResponse, UserDetailsResponse } from '../shared/models/auth';
import { Observable } from 'rxjs';
import { AUTH_URL } from '../shared/constants/urls';

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

  checkTokenValidity(): Observable<boolean> {
    return this.http.get<boolean>(`${AUTH_URL}/access/validate-token`);
  }

  /**
   * Account fields of the signed-in user. The auth mapper never fills `profile` here, so the
   * avatar and profile data have to come from the profile module (UserService.getProfile).
   */
  getUserData(): Observable<UserDetailsResponse> {
    return this.http.get<UserDetailsResponse>(`${AUTH_URL}/v1/details`);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  isAdmin(): Observable<boolean> {
    return this.http.get<boolean>(`${AUTH_URL}/access/is-admin`);
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
