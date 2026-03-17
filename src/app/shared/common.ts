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

  formatEnum(value: string): string {
    return value
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}
