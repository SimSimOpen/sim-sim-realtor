import { Component } from '@angular/core';
import { Common } from '../../shared/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar-menu',
  imports: [],
  templateUrl: './sidebar-menu.html',
  styleUrl: './sidebar-menu.scss',
})
export class SidebarMenu {
  constructor(
    public common: Common,
    private router: Router,
  ) {
    this.common.activeMenuItem = this.router.url;
  }
}
