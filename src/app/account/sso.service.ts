import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Fragment the client app hands over when an agent taps "Post ad": `http://localhost:4200/#sso=<jwt>`.
 * The two apps are different origins, so they do not share sessionStorage and the token has to
 * travel in the URL. A fragment is used because it is never sent to the server or written to logs.
 */
const SSO_FRAGMENT = '#sso=';

@Injectable({ providedIn: 'root' })
export class SsoService {
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Picks up a handed-over token, if the URL carries one. Returns true when a handoff was found so
   * the caller knows the app is about to route itself; nothing else has to be done.
   */
  consumeHandoff(): boolean {
    const token = this.takeTokenFromFragment();
    if (!token) {
      return false;
    }
    this.authService.storeToken(token);
    this.authService
      .getUserData()
      .subscribe({
        next: (details) => {
          this.authService.setUsername(details.username);
          // The account is stored before navigating: the sidebar and the dashboard read the roles
          // from storage at construction time to decide which menus and stats to show.
          this.authService.setUserData({
            id: details.id,
            username: details.username,
            email: details.email,
            authorities: details.roles ?? [],
            profile: details.profile,
          });
          this.router.navigate(['/dashboard'], {
            queryParams: { add: '1' },
            replaceUrl: true,
          });
        },
        // A rejected token means there is no session to keep, so drop it and stay on the login page.
        error: () => {
          this.authService.clearStorage();
          this.router.navigate(['/'], { replaceUrl: true });
        },
      });
    return true;
  }

  /** Reads the token out of the address bar and removes the fragment in the same step. */
  private takeTokenFromFragment(): string | null {
    const hash = window.location.hash;
    if (!hash.startsWith(SSO_FRAGMENT)) {
      return null;
    }
    const token = decodeURIComponent(hash.slice(SSO_FRAGMENT.length)).split('&')[0].trim();
    // Rewrite the URL straight away so the token does not linger in the address bar, the history
    // entry, or a bookmark the user might create a second later.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return token || null;
  }
}
