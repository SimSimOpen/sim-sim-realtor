import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, finalize, Subject, Subscription } from 'rxjs';
import { ModalComponent } from '../../components/modal/modal.component';
import { ClientResponse, UserService } from '../../shared/services/user.service';
import { formatPhone } from '../../shared/utils/phone-mask.directive';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';

interface ClientUser {
  id: number;
  name: string;
  /** Second line under the name: email, or the username when that is not just the phone again. */
  subtitle: string;
  phone: string;
  signInMethod: 'PHONE' | 'PASSWORD';
  status: 'active' | 'inactive';
  lastActive: string | null;
  dateJoined: string | null;
  avatarUrl: string | null;
  raw: ClientResponse;
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-users',
  imports: [CommonModule, ModalComponent, TranslatePipe],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);
  private i18n = inject(I18nService);

  users = signal<ClientUser[]>([]);
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  search = signal('');
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  readonly pageSize = PAGE_SIZE;

  viewingUser = signal<ClientUser | null>(null);

  private searchInput = new Subject<string>();
  private loadSub: Subscription | null = null;

  ngOnInit() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.search.set(term);
        this.page.set(0);
        this.loadUsers();
      });
    this.loadUsers();
  }

  onSearch(event: Event) {
    this.searchInput.next((event.target as HTMLInputElement).value.trim());
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages() || page === this.page()) {
      return;
    }
    this.page.set(page);
    this.loadUsers();
  }

  loadUsers() {
    // A newer search wins over a slower, older response
    this.loadSub?.unsubscribe();
    this.isLoading.set(true);
    this.loadError.set(null);
    this.loadSub = this.userService
      .getClients(this.search(), this.page(), PAGE_SIZE)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (resp) => {
          this.users.set(resp.content.map((c) => this.toUser(c)));
          this.totalPages.set(resp.totalPages);
          this.totalElements.set(resp.totalElements);
        },
        error: (err) => {
          this.users.set([]);
          this.loadError.set(
            err?.status === 403
              ? this.i18n.t('users.err.forbidden')
              : err?.status === 404
                ? this.i18n.t('users.err.notFound')
                : this.i18n.t('users.err.load'),
          );
        },
      });
  }

  private toUser(c: ClientResponse): ClientUser {
    const fullName = [c.profile?.firstName, c.profile?.lastName].filter(Boolean).join(' ').trim();
    const phone = c.phoneNumber ? formatPhone(c.phoneNumber) : '';
    const usernameIsPhone = c.username?.replace(/\D/g, '') === c.phoneNumber?.replace(/\D/g, '');
    return {
      id: c.id,
      name: fullName || (c.signInMethod === 'PHONE' && phone ? phone : c.username),
      subtitle: c.email || (usernameIsPhone || !fullName ? '' : c.username),
      phone: phone || '-',
      signInMethod: c.signInMethod,
      status: c.enabled === false ? 'inactive' : 'active',
      lastActive: c.lastActiveAt,
      dateJoined: c.createdAt,
      avatarUrl: c.profile?.profileImageUrl || null,
      raw: c,
    };
  }

  openViewUser(user: ClientUser) {
    this.viewingUser.set(user);
  }

  closeViewUser() {
    this.viewingUser.set(null);
  }

  getSignInClass(user: ClientUser) {
    return user.signInMethod === 'PHONE'
      ? 'bg-purple-50 text-purple-700 py-0.5 px-2.5 rounded-full border border-purple-200'
      : 'bg-gray-50 text-gray-700 py-0.5 px-2.5 rounded-full border border-gray-200';
  }

  getStatusClass(user: ClientUser) {
    if (user.status === 'active') {
      return 'bg-green-50 text-green-700 py-0.5 px-2.5 rounded-full border border-green-200';
    }
    return 'bg-gray-50 text-gray-700 py-0.5 px-2.5 rounded-full border border-gray-200';
  }
}
