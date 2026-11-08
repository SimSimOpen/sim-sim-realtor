import { Component, inject } from '@angular/core';
import { ChatService } from '../../shared/services/chat.service';
import { Common } from '../../shared/common';
import { Router } from '@angular/router';
import { AuthService } from '../../account/auth.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { BrandMark } from '../brand-mark';

@Component({
  selector: 'app-sidebar-menu',
  imports: [TranslatePipe, BrandMark],
  templateUrl: './sidebar-menu.html',
  styleUrl: './sidebar-menu.scss',
})
export class SidebarMenu {
  /** Agents manages other accounts, so only ADMIN and MANAGER see that entry. */
  readonly isAdmin: boolean;
  /** Unread chat messages, for the Messages badge. */
  readonly chat = inject(ChatService);

  constructor(
    public common: Common,
    private router: Router,
    private authService: AuthService,
  ) {
    this.common.activeMenuItem = this.router.url;
    this.isAdmin = this.authService.isAdminRole();
    this.chat.reload();
  }

  signOut() {
    this.common.navigateTo('/');
    this.authService.clearStorage();
  }
  redirectToClientPage() {
    window.open('https://simsim.fit', '_self');
  }
}
