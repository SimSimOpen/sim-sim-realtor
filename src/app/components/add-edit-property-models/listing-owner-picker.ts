import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../account/auth.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { AgentResponse } from '../../shared/services/agent.service';
import { ListingOwnerService } from '../../shared/services/listing-owner.service';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';

/** Admin-only "Post as" selector shown before a new listing's draft exists. */
@Component({
  selector: 'app-listing-owner-picker',
  imports: [TranslatePipe],
  standalone: true,
  template: `@if (owner.canChoose() && !editing()?.id) {
    <label class="flex flex-col gap-1 w-full max-w-2xl mb-4">
      <span class="text-sm font-medium text-gray-700">{{ 'owner.postAs' | t }}</span>
      <select
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        (change)="select($any($event.target).value)"
      >
        <option value="" [selected]="owner.agentId() === null">
          {{ 'owner.me' | t: { name: myName } }}
        </option>
        @for (agent of owner.agents(); track agent.id) {
          @if (agent.id !== myId) {
            <option [value]="agent.id" [selected]="agent.id === owner.agentId()">
              {{ label(agent) }}
            </option>
          }
        }
      </select>
      <span class="text-xs text-gray-500">{{ 'owner.hint' | t }}</span>
    </label>
  }`,
})
export class ListingOwnerPicker implements OnInit {
  readonly owner = inject(ListingOwnerService);
  private auth = inject(AuthService);
  readonly editing = inject(ProductStateService).editingProperty;

  readonly myId = this.auth.getUserDataFromStorage()?.id;
  readonly myName = this.auth.getUserDataFromStorage()?.username ?? '';

  ngOnInit() {
    this.owner.reset();
    this.owner.loadAgents();
  }

  select(value: string) {
    this.owner.agentId.set(value ? Number(value) : null);
  }

  label(agent: AgentResponse) {
    const full = [agent.profile?.firstName, agent.profile?.lastName].filter(Boolean).join(' ');
    return full ? `${full} (${agent.username})` : agent.username;
  }
}
