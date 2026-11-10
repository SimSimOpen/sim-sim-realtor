import { inject, Injectable, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { filter, take } from 'rxjs';
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

  /** True while a handed-over token is being verified; the app shows a loader instead of a page. */
  readonly pending = signal(false);

  /**
   * Starts the router's first navigation. Initial navigation is disabled in app.config, so this
   * must be called exactly once on startup: straight away when there is no handoff, otherwise
   * after the token is checked, with the address bar already pointing where the agent should land.
   * The login page is therefore never rendered during a handoff, but stays the default route.
   */
  start(): void {
    const token = this.takeTokenFromFragment();
    if (!token) {
      this.router.initialNavigation();
      return;
    }
    this.pending.set(true);
    this.authService.storeToken(token);
    this.authService.getUserData().subscribe({
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
        this.navigateFirst('/dashboard?add=1');
      },
      // A rejected token means there is no session to keep, so drop it and land on the login page.
      error: () => {
        this.authService.clearStorage();
        this.navigateFirst('/');
      },
    });
  }

  /**
   * initialNavigation() (not navigate()) is what also wires up back/forward handling, and it
   * navigates to whatever the address bar holds, so the target is written there first.
   */
  private navigateFirst(url: string): void {
    window.history.replaceState(null, '', url);
    // The loader stays up until the target page is in place, lazy chunk included.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
        take(1),
      )
      .subscribe(() => this.pending.set(false));
    this.router.initialNavigation();
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
