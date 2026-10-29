import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserData, UserDetailsResponse, UserProfile } from '../models/auth';
import { Observable } from 'rxjs';
import { AUTH_URL, PROFILE_URL } from '../constants/urls';
/** A website (CLIENT) account, from GET /api/auth/v1/admin/clients. */
export interface ClientResponse {
  id: number;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  /** PHONE: signed up with an SMS/Telegram code. PASSWORD: registered with username + password. */
  signInMethod: 'PHONE' | 'PASSWORD';
  enabled: boolean;
  createdAt: string | null;
  lastActiveAt: string | null;
  profile: Partial<UserProfile> | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {}
  private http = inject(HttpClient);

  getClients(search: string, page: number, size: number): Observable<PageResponse<ClientResponse>> {
    const params = new HttpParams().set('search', search).set('page', page).set('size', size);
    return this.http.get<PageResponse<ClientResponse>>(`${AUTH_URL}/v1/admin/clients`, { params });
  }

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
