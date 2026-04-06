import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalService {
  isProductImageOpened = false;

  set ProductImageOpened(isOpen: boolean) {
    this.isProductImageOpened = isOpen;
  }

  get ProductImageOpened() {
    return this.isProductImageOpened;
  }
}
