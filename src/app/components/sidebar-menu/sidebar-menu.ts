import { Component, HostListener } from '@angular/core';
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
  constructor(
    public common: Common,
    private router: Router,
    private authService: AuthService,
  ) {
    this.common.activeMenuItem = this.router.url;
  }

  signOut() {
    this.common.navigateTo('/');
    this.authService.clearStorage();
  }
}
