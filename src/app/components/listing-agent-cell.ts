import { Component, computed, inject, input } from '@angular/core';
import { AgentDirectoryService } from '../shared/services/agent-directory.service';

/** Table cell naming the agent who owns a listing: full name, with the phone below it. */
@Component({
  selector: 'app-listing-agent-cell',
  template: `
    <div class="text-sm font-medium text-gray-900">{{ name() }}</div>
    @if (phone(); as p) {
      <div class="text-xs text-gray-500 mt-0.5 whitespace-nowrap">{{ p }}</div>
    }
  `,
})
export class ListingAgentCell {
  private directory = inject(AgentDirectoryService);

  readonly agentId = input<number | null | undefined>();
  /** The username stored on the listing, shown until (or unless) the agent is found. */
  readonly fallback = input<string | null | undefined>();

  private readonly agent = computed(() => {
    const id = this.agentId();
    return id == null ? undefined : this.directory.byId().get(id);
  });

  readonly name = computed(() => {
    const a = this.agent();
    const full = [a?.profile?.firstName, a?.profile?.lastName].filter((s) => !!s?.trim()).join(' ');
    return full || a?.username || this.fallback() || '—';
  });

  readonly phone = computed(() => {
    const a = this.agent();
    const p = a?.phoneNumber || a?.profile?.phoneNumber;
    return p && p !== this.name() ? p : null;
  });
}
