import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { PRODUCT_URL } from '../constants/urls';
import { SseService } from './sse.service';
import { ListingKind } from './statistics.service';

const CHAT_URL = `${PRODUCT_URL}/v1/chat`;
const PAGE_SIZE = 50;

export type ChatRole = 'CLIENT' | 'AGENT';

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderRole: ChatRole;
  body: string;
  createdAt: string;
}

/** A conversation as the signed-in agent sees it; `counterpartName` is the client. */
export interface Conversation {
  id: number;
  kind: ListingKind;
  listingId: number;
  listingTitle: string | null;
  role: ChatRole;
  counterpartName: string | null;
  lastMessage: string | null;
  lastSenderRole: ChatRole | null;
  lastMessageAt: string | null;
  unread: number;
}

/**
 * The agent side of listing chats: clients write from the public site, agents answer from the
 * Messages page. New messages arrive as `chat` events on the panel's existing SSE stream.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private sse = inject(SseService);

  readonly conversations = signal<Conversation[]>([]);
  readonly selectedId = signal<number | null>(null);
  readonly messages = signal<Record<number, ChatMessage[]>>({});
  readonly complete = signal<Set<number>>(new Set());
  readonly totalUnread = computed(() =>
    this.conversations().reduce((sum, c) => sum + (c.unread || 0), 0),
  );

  constructor() {
    this.sse.chat$.subscribe((data) => {
      try {
        const payload = JSON.parse(data);
        if (payload?.type === 'message') this.receive(payload.message as ChatMessage);
      } catch {
        // ignore malformed events
      }
    });
    // Nothing is replayed after a dropped stream, so refresh from the API on every reconnect.
    this.sse.connected$.subscribe(() => {
      this.reload();
      const id = this.selectedId();
      if (id != null) this.loadMessages(id);
    });
  }

  conversation(id: number | null): Conversation | undefined {
    return id == null ? undefined : this.conversations().find((c) => c.id === id);
  }

  reload() {
    this.http.get<Conversation[]>(`${CHAT_URL}/conversations`).subscribe({
      next: (list) => this.conversations.set(list),
      error: () => undefined,
    });
  }

  select(id: number | null) {
    this.selectedId.set(id);
    if (id == null) return;
    if (!(id in this.messages())) this.loadMessages(id);
    this.markRead(id);
  }

  send(id: number, body: string): Observable<ChatMessage> {
    return this.http
      .post<ChatMessage>(`${CHAT_URL}/conversations/${id}/messages`, { body })
      .pipe(tap((message) => this.receive(message)));
  }

  loadOlder(id: number) {
    const first = this.messages()[id]?.[0];
    if (first && !this.complete().has(id)) this.loadMessages(id, first.id);
  }

  /** Both the send response and the stream deliver our own messages, so dedupe by id. */
  private receive(message: ChatMessage) {
    const id = message.conversationId;
    const known = this.conversation(id);
    if (!known) {
      this.http.get<Conversation>(`${CHAT_URL}/conversations/${id}`).subscribe({
        next: (c) => this.upsert(c),
        error: () => undefined,
      });
    }
    const list = this.messages()[id];
    if (list?.some((m) => m.id === message.id)) return;
    if (list) this.messages.update((all) => ({ ...all, [id]: [...list, message] }));
    if (!known) return;

    const mine = message.senderRole === known.role;
    const visible = this.selectedId() === id && document.visibilityState === 'visible';
    this.upsert({
      ...known,
      lastMessage: message.body,
      lastSenderRole: message.senderRole,
      lastMessageAt: message.createdAt,
      unread: mine || visible ? 0 : known.unread + 1,
    });
    if (!mine && visible) this.markRead(id);
  }

  private loadMessages(id: number, before?: number) {
    const params: Record<string, number> = before ? { before } : {};
    this.http
      .get<ChatMessage[]>(`${CHAT_URL}/conversations/${id}/messages`, { params })
      .subscribe({
        next: (page) => {
          this.messages.update((all) => ({
            ...all,
            [id]: before ? [...page, ...(all[id] ?? [])] : page,
          }));
          if (page.length < PAGE_SIZE) this.complete.update((s) => new Set(s).add(id));
        },
        error: () => this.messages.update((all) => ({ ...all, [id]: all[id] ?? [] })),
      });
  }

  private markRead(id: number) {
    const c = this.conversation(id);
    if (c?.unread) this.upsert({ ...c, unread: 0 });
    this.http.post(`${CHAT_URL}/conversations/${id}/read`, null).subscribe({ error: () => undefined });
  }

  private upsert(conversation: Conversation) {
    const rest = this.conversations().filter((c) => c.id !== conversation.id);
    const at = (c: Conversation) => c.lastMessageAt ?? '';
    this.conversations.set([conversation, ...rest].sort((a, b) => at(b).localeCompare(at(a))));
  }
}
