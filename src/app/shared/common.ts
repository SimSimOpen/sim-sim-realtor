import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Common {
  constructor(private router: Router) {}

  navigeteTo(url: string): void {
    this.router.navigate([url]);
  }
}
