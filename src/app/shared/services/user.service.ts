import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserData, UserDetailsResponse, UserProfile } from '../models/auth';
import { Observable } from 'rxjs';
import { AUTH_URL, PROFILE_URL } from '../constants/urls';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {}
  private http = inject(HttpClient);

  updateUserData(userData: Omit<UserData, 'description'>): Observable<UserDetailsResponse> {
    return this.http.put<UserDetailsResponse>(`${AUTH_URL}/v1/update-user`, userData);
  }

  /**
   * The profile module is the only place that prefixes the media base URL, so this is the source
   * of truth for an absolute avatar URL (the auth endpoints return the stored relative path or no
   * profile at all).
   */
  getProfile(profileId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${PROFILE_URL}/v1/${profileId}`);
  }
}
