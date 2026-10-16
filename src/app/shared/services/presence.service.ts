import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { EnvironmentTs } from '../../environments/environment';
import { AuthService } from '../../account/auth.service';

const HEARTBEAT_MS = 30_000; // keep in step with PresenceService.HEARTBEAT on the backend
const VISITOR_KEY = 'simsim.visitorId';

/**
 * Tells the backend this page is open, so the admin dashboard can show who is online. Beats every
 * 30s while the tab is visible and stops while it is hidden, so background tabs drop off the count.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly visitorId = visitorId();

  start() {
    const onVisibility = () => (document.hidden ? this.stop() : this.resume());
    document.addEventListener('visibilitychange', onVisibility);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      this.stop();
    });
    if (!document.hidden) this.resume();
  }

  private resume() {
    if (this.timer) return;
    this.beat();
    this.timer = setInterval(() => this.beat(), HEARTBEAT_MS);
  }

  private stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private beat() {
    // Staff only count once signed in; the login screen is not "using the panel".
    if (!this.authService.isAuthenticated()) return;
    this.http
      .post(`${EnvironmentTs.URL}/api/event/presence/heartbeat`, { app: 'admin', visitorId: this.visitorId })
      .subscribe({ error: () => undefined }); // presence is best-effort; never bother the user
  }
}

/** A random id per browser, remembered so one person with several tabs counts once. */
function visitorId(): string {
  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    // Storage blocked: count this tab on its own for this visit.
    return crypto.randomUUID();
  }
}
