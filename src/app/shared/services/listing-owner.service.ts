import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../account/auth.service';
import { AgentResponse, AgentService } from './agent.service';

/**
 * Lets an admin create a new listing in another agent's name. The chosen agent id is sent with
 * `create-draft`; the backend accepts it only from an ADMIN, so the picker is shown to ADMIN only.
 */
@Injectable({ providedIn: 'root' })
export class ListingOwnerService {
  private auth = inject(AuthService);
  private agentService = inject(AgentService);

  /** Agent the next draft is created for; null means the signed-in user. */
  readonly agentId = signal<number | null>(null);
  readonly agents = signal<AgentResponse[]>([]);
  readonly canChoose = computed(() => this.auth.hasAnyRole(['ADMIN']));

  private loaded = false;

  reset() {
    this.agentId.set(null);
  }

  loadAgents() {
    if (this.loaded || !this.canChoose()) return;
    this.agentService.getAgents().subscribe({
      next: (list) => {
        this.loaded = true;
        this.agents.set(
          list
            .filter((a) => !a.deletedAt && a.enabled !== false)
            .sort((a, b) => a.username.localeCompare(b.username)),
        );
      },
    });
  }
}
