import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../account/auth.service';
import { AgentResponse, AgentService } from './agent.service';

/**
 * Agents by id, for the admin's listing tables: an admin sees every agent's listings, so each row
 * names its agent. Loaded once and only for ADMIN, the one role the backend shows all listings to.
 */
@Injectable({ providedIn: 'root' })
export class AgentDirectoryService {
  private auth = inject(AuthService);
  private agentService = inject(AgentService);

  readonly byId = signal<ReadonlyMap<number, AgentResponse>>(new Map());
  private requested = false;

  /** True when the signed-in user sees all listings and so needs the agent column. */
  showsAllListings(): boolean {
    return this.auth.hasAnyRole(['ADMIN']);
  }

  load() {
    if (this.requested || !this.showsAllListings()) return;
    this.requested = true;
    this.agentService.getAgents().subscribe({
      next: (list) => this.byId.set(new Map(list.map((a) => [a.id, a]))),
      error: () => (this.requested = false),
    });
  }
}
