import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Common {
  activeMenuItem: string = '';

  constructor(private router: Router) {}

  navigateTo(url: string): void {
    this.router.navigate([url]);
  }

  setActiveMenuItem(menuItem: string) {
    this.activeMenuItem = menuItem;
  }
}
