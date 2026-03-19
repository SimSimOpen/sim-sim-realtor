import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthResponse } from '../shared/models/auth';
import { Observable } from 'rxjs';
import { AUTH_URL } from '../shared/constants/urls';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  authenticate(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${AUTH_URL}/v1/authenticate`, {
      username,
      password,
    });
  }
  registerAgent(username: string, email: string, password: string): Observable<void> {
    return this.http.post<void>(`${AUTH_URL}/v1/register/agent`, {
      username,
      email,
      password,
    });
  }

  checkTokenValidity(): Observable<boolean> {
    return this.http.get<boolean>(`${AUTH_URL}/access/validate-token`);
  }

  getUserData(): Observable<any> {
    return this.http.get<any>(`${AUTH_URL}/check-token`);
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

  clearStorage() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
  }
}
