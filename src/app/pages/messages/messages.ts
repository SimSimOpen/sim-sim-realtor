import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { I18nService } from '../../shared/i18n/i18n.service';
import { EnvironmentTs } from '../../environments/environment';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { ChatService } from '../../shared/services/chat.service';
import { ListingKind } from '../../shared/services/statistics.service';

/** Public-site page of each listing kind, for opening the listing a chat is about. */
const PAGE_SLUG: Record<ListingKind, string> = {
  PROPERTY: 'real-estate',
  CAR: 'cars',
  SECOND_HAND: 'second-hand',
  SERVICE: 'services',
};

/** The agent's inbox: chats clients started from the agent's listings on the public site. */
@Component({
  selector: 'app-messages',
  imports: [DatePipe, FormsModule, TranslatePipe],
  template: `
    <div class="p-4 sm:p-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ 'chat.title' | t }}</h1>
      <p class="text-gray-500 mb-6">{{ 'chat.subtitle' | t }}</p>

      <div
        class="grid md:grid-cols-[20rem_1fr] bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-[calc(100vh-14rem)] min-h-[28rem]"
      >
        <!-- Conversation list; on phones it gives way to the open thread. -->
        <aside class="border-r border-gray-100 overflow-y-auto md:block {{ selected() ? 'hidden' : '' }}">
          @if (!chat.conversations().length) {
            <p class="p-6 text-sm text-gray-500 text-center">{{ 'chat.none' | t }}</p>
          }
          @for (c of chat.conversations(); track c.id) {
            <button
              type="button"
              class="flex w-full items-start gap-2 px-4 py-3 text-left border-b border-gray-50 hover:bg-gray-50"
              [class.bg-blue-50]="c.id === chat.selectedId()"
              (click)="chat.select(c.id)"
            >
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold text-gray-900">
                  {{ c.counterpartName || ('chat.client' | t) }}
                </div>
                <div class="truncate text-xs text-blue-700">{{ c.listingTitle }}</div>
                @if (c.lastMessage) {
                  <div class="truncate text-xs text-gray-500">
                    @if (c.lastSenderRole === c.role) {
                      {{ 'chat.you' | t }}:
                    }
                    {{ c.lastMessage }}
                  </div>
                }
              </div>
              <div class="flex flex-col items-end gap-1">
                @if (c.lastMessageAt) {
                  <span class="text-[10px] text-gray-400">{{ c.lastMessageAt | date: 'dd.MM HH:mm' }}</span>
                }
                @if (c.unread) {
                  <span class="rounded-full bg-red-500 text-white text-[10px] font-semibold px-1.5">
                    {{ c.unread }}
                  </span>
                }
              </div>
            </button>
          }
        </aside>

        @if (selected(); as c) {
          <section class="flex flex-col min-h-0">
            <header class="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button
                type="button"
                class="md:hidden p-1 rounded text-gray-500 hover:bg-gray-100"
                [attr.aria-label]="'chat.back' | t"
                (click)="chat.select(null)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </button>
              <div class="min-w-0 flex-1">
                <a
                  class="block truncate text-sm font-semibold text-gray-900 hover:text-blue-700 hover:underline"
                  [href]="listingUrl(c.kind, c.listingId)"
                  target="_blank"
                  rel="noopener"
                  [title]="'chat.openListing' | t"
                >
                  {{ c.listingTitle }}
                </a>
                <div class="truncate text-xs text-gray-500">{{ c.counterpartName }}</div>
              </div>
            </header>

            <div #scroller class="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
              @if (messages(); as list) {
                @if (!chat.complete().has(c.id)) {
                  <button
                    type="button"
                    class="block mx-auto text-xs text-blue-700 hover:underline"
                    (click)="loadOlder(c.id)"
                  >
                    {{ 'chat.older' | t }}
                  </button>
                }
                @for (m of list; track m.id) {
                  @let mine = m.senderRole === c.role;
                  <div class="flex" [class.justify-end]="mine">
                    <div
                      class="max-w-[75%] rounded-2xl px-3 py-1.5 text-sm whitespace-pre-wrap break-words"
                      [class]="mine ? 'bg-blue-700 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'"
                    >
                      {{ m.body }}
                      <div class="text-[10px] mt-0.5 text-right" [class]="mine ? 'text-blue-100' : 'text-gray-400'">
                        {{ m.createdAt | date: 'dd.MM HH:mm' }}
                      </div>
                    </div>
                  </div>
                }
              } @else {
                <p class="text-center text-xs text-gray-400 py-6">{{ 'common.loading' | t }}</p>
              }
            </div>

            <form class="flex items-end gap-2 p-3 border-t border-gray-100" (ngSubmit)="send(c.id)">
              <textarea
                name="draft"
                rows="1"
                maxlength="2000"
                class="flex-1 resize-none max-h-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                [placeholder]="'chat.placeholder' | t"
                [(ngModel)]="draft"
                (keydown.enter)="onEnter($event, c.id)"
              ></textarea>
              <button
                type="submit"
                class="h-9 rounded-md bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                [disabled]="sending() || !draft.trim()"
              >
                {{ 'chat.send' | t }}
              </button>
            </form>
          </section>
        } @else {
          <div class="hidden md:flex items-center justify-center text-sm text-gray-400">
            {{ 'chat.pick' | t }}
          </div>
        }
      </div>
    </div>
  `,
})
export class Messages {
  readonly chat = inject(ChatService);
  private toastr = inject(ToastrService);
  private i18n = inject(I18nService);

  readonly selected = computed(() => this.chat.conversation(this.chat.selectedId()));
  readonly messages = computed(() => {
    const id = this.chat.selectedId();
    return id == null ? undefined : this.chat.messages()[id];
  });
  readonly sending = signal(false);
  draft = '';

  private readonly scroller = viewChild<ElementRef<HTMLDivElement>>('scroller');
  private loadingOlder = false;

  constructor() {
    this.chat.reload();
    effect(() => {
      const last = this.messages()?.at(-1)?.id;
      const el = this.scroller()?.nativeElement;
      untracked(() => {
        if (!el || last === undefined) return;
        if (this.loadingOlder) {
          this.loadingOlder = false;
          return;
        }
        setTimeout(() => (el.scrollTop = el.scrollHeight));
      });
    });
  }

  ngOnDestroy() {
    // Leaving the page means new messages there are no longer being read.
    this.chat.select(null);
  }

  listingUrl(kind: ListingKind, id: number): string {
    return `${EnvironmentTs.CLIENT_URL}/${PAGE_SLUG[kind]}?listing=${id}`;
  }

  onEnter(event: Event, id: number) {
    if ((event as KeyboardEvent).shiftKey) return;
    event.preventDefault();
    this.send(id);
  }

  send(id: number) {
    const body = this.draft.trim();
    if (!body || this.sending()) return;
    this.sending.set(true);
    this.chat.send(id, body).subscribe({
      next: () => {
        this.draft = '';
        this.sending.set(false);
      },
      error: () => {
        this.sending.set(false);
        this.toastr.error(this.i18n.t('chat.failed'));
      },
    });
  }

  loadOlder(id: number) {
    this.loadingOlder = true;
    this.chat.loadOlder(id);
  }
}
