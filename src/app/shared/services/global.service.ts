import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalService {
  isProductImageOpened = false;
  mobilesessionStarted = signal(false);

  set MobilesessionStarted(isStarted: boolean) {
    this.mobilesessionStarted.set(isStarted);
  }

  get MobilesessionStarted() {
    return this.mobilesessionStarted();
  }

  set ProductImageOpened(isOpen: boolean) {
    this.isProductImageOpened = isOpen;
  }

  get ProductImageOpened() {
    return this.isProductImageOpened;
  }
}
