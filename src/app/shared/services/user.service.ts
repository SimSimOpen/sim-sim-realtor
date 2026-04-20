import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthResponse, UserData } from '../models/auth';
import { Observable } from 'rxjs';
import { AUTH_URL } from '../constants/urls';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {}
  private http = inject(HttpClient);

  updateUserData(userData: Omit<UserData, 'description'>): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${AUTH_URL}/v1/update-user`, userData);
  }
}
