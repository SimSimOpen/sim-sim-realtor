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
    localStorage.setItem('authToken', token);
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  setUsername(username: string) {
    localStorage.setItem('username', username);
  }
  getUsername() {
    return localStorage.getItem('username');
  }

  clearStorage() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
  }
}
