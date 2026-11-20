import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthResponse, UserDetailsResponse } from '../shared/models/auth';
import { catchError, finalize, map, Observable, of, shareReplay } from 'rxjs';
import { AUTH_URL } from '../shared/constants/urls';

const TOKEN_KEY = 'authToken';
const REFRESH_KEY = 'refreshToken';
const USERNAME_KEY = 'username';

/**
 * Refresh this long before the access token expires, which also absorbs clock skew; capped at a
 * quarter of the token's lifetime so a short-lived token is not refreshed the moment it arrives.
 */
const REFRESH_MARGIN_MS = 5 * 60_000;

/**
 * Sessions used to live in sessionStorage and died with the tab; they now live in localStorage so
 * the panel stays signed in across tabs and browser restarts. Moves an old session over once.
 */
function migrateSession() {
  if (localStorage.getItem(TOKEN_KEY) || !sessionStorage.getItem(TOKEN_KEY)) return;
  for (const key of [TOKEN_KEY, USERNAME_KEY]) {
    const value = sessionStorage.getItem(key);
    if (value !== null) localStorage.setItem(key, value);
    sessionStorage.removeItem(key);
  }
}

function decodePayload(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

/** When to refresh a JWT, in ms since the epoch, or null when its expiry cannot be read. */
function refreshAt(token: string): number | null {
  const { exp, iat } = decodePayload(token) ?? {};
  if (typeof exp !== 'number') return null;
  const lifetime = typeof iat === 'number' ? (exp - iat) * 1000 : Infinity;
  return exp * 1000 - Math.min(REFRESH_MARGIN_MS, lifetime / 4);
}

/** Roles that see the whole admin, matching the backend's `hasAnyAuthority('ADMIN','MANAGER')`. */
export const ADMIN_ROLES = ['ADMIN', 'MANAGER'];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  /** Bypasses the interceptors, which themselves wait on a refresh. */
  private rawHttp = new HttpClient(inject(HttpBackend));
  private router = inject(Router);

  /** The stored access token; changes on sign-in, refresh, sign-out, and in other tabs. */
  readonly token = signal<string | null>((migrateSession(), localStorage.getItem(TOKEN_KEY)));

  private refreshing?: Observable<string | null>;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.scheduleRefresh();
    // A laptop waking up: timers were paused, so check right away.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.validToken().subscribe();
    });
    // Another tab signed in, out, or refreshed (which rotates the shared refresh token).
    window.addEventListener('storage', (event) => {
      if (event.key === TOKEN_KEY || event.key === null) {
        this.token.set(localStorage.getItem(TOKEN_KEY));
        this.scheduleRefresh();
      }
    });
  }

  /**
   * Refresh ahead of expiry, so the token stays valid even while nothing is being requested and a
   * reconnecting event stream always picks up a live token.
   */
  private scheduleRefresh() {
    clearTimeout(this.refreshTimer);
    const token = this.token();
    const at = token ? refreshAt(token) : null;
    if (at === null || !localStorage.getItem(REFRESH_KEY)) return;
    const delay = Math.max(at - Date.now(), 0);
    // setTimeout overflows past ~24.8 days; the interceptor covers anything left after that.
    this.refreshTimer = setTimeout(() => this.refresh().subscribe(), Math.min(delay, 2 ** 31 - 1));
  }

  /**
   * The token to send with a request: the stored one, or a freshly refreshed one when it is about
   * to expire. Null when signed out.
   */
  validToken(): Observable<string | null> {
    const token = this.token();
    if (!token) return of(null);
    const at = refreshAt(token);
    if (at === null || at > Date.now()) return of(token);
    return this.refresh();
  }

  /** Swaps the refresh token for a new pair; concurrent callers share one request. */
  refresh(): Observable<string | null> {
    if (this.refreshing) return this.refreshing;
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      // A session without a refresh token (handed over by the client app, or from before this
      // change): usable until it expires, then signed out.
      if (this.isTokenExpired()) this.signOut();
      return of(this.token());
    }
    this.refreshing = this.rawHttp
      .post<AuthResponse>(`${AUTH_URL}/v1/refresh`, { refreshToken })
      .pipe(
        map((resp) => {
          this.storeToken(resp.token, resp.refreshToken);
          return resp.token as string | null;
        }),
        catchError((err: HttpErrorResponse) => {
          const latest = localStorage.getItem(REFRESH_KEY);
          if (latest && latest !== refreshToken) {
            // Another tab refreshed first and rotated the token; adopt its session.
            this.token.set(localStorage.getItem(TOKEN_KEY));
            this.scheduleRefresh();
          } else if (err.status >= 400 && err.status < 500) {
            // Refresh token expired or revoked: the user has to sign in again.
            this.signOut();
          } else {
            // Offline or server down: keep the session and try again in a minute.
            clearTimeout(this.refreshTimer);
            this.refreshTimer = setTimeout(() => this.refresh().subscribe(), 60_000);
          }
          return of(this.token());
        }),
        finalize(() => (this.refreshing = undefined)),
        shareReplay(1),
      );
    return this.refreshing;
  }

  /** Whether there is a usable session, renewing it first if it has expired; for route guards. */
  hasSession(): Observable<boolean> {
    return this.validToken().pipe(map(() => !!this.token() && !this.isTokenExpired()));
  }

  /** Drops the session and goes to the login page (unless on the phone upload pages). */
  private signOut() {
    this.clearStorage();
    if (!this.router.url.startsWith('/mobile')) this.router.navigateByUrl('/');
  }

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
    const exp = decodePayload(token)?.['exp'];
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

  /** Stores a new session. Without a refresh token (client-app handoff) any old one is dropped. */
  storeToken(token: string, refreshToken?: string | null) {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    else localStorage.removeItem(REFRESH_KEY);
    this.token.set(token);
    this.scheduleRefresh();
  }

  getToken() {
    return this.token();
  }

  setUsername(username: string) {
    localStorage.setItem(USERNAME_KEY, username);
  }

  getUsername() {
    return localStorage.getItem(USERNAME_KEY);
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
    clearTimeout(this.refreshTimer);
    for (const key of [TOKEN_KEY, REFRESH_KEY, USERNAME_KEY]) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    localStorage.removeItem('userProfile');
    this.token.set(null);
  }
}
