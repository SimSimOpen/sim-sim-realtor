import { Injectable, signal } from '@angular/core';

export type ListingKind = 'property' | 'car';

/** Backend routes that differ per listing kind; everything else in the media flow is shared. */
export const LISTING_ROUTES: Record<ListingKind, { product: string; upload: string; idParam: string }> = {
  property: { product: 'property', upload: 'upload-product-media', idParam: 'property_id' },
  car: { product: 'car', upload: 'upload-car-media', idParam: 'car_id' },
};

/**
 * Which kind of listing the shared photo upload components (computer, mobile QR, uploaded files)
 * are working on. Each section page sets it on init, the mobile camera page takes it from the QR link.
 */
@Injectable({ providedIn: 'root' })
export class ListingKindService {
  readonly kind = signal<ListingKind>('property');

  routes() {
    return LISTING_ROUTES[this.kind()];
  }
}
