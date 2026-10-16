import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PresenceService } from './shared/services/presence.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    inject(PresenceService).start();
  }

  protected readonly title = signal('sim-sim-admin');
}
