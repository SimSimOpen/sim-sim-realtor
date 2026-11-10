import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PresenceService } from './shared/services/presence.service';
import { SsoService } from './account/sso.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly sso = inject(SsoService);

  constructor() {
    // A token handed over by the client app has to be stored before the presence heartbeat starts;
    // this also starts the router's first navigation (see SsoService.start).
    this.sso.start();
    inject(PresenceService).start();
  }

  protected readonly title = signal('sim-sim-admin');
}
