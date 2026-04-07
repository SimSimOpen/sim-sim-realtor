import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Property } from './models/properties';
import { ProductStateService } from './services/product/state/product-state.service';
import { SseService } from './services/sse.service';
import { ProductApiService } from './services/product/state/product-api.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class Common {
  activeMenuItem: string = '';
  mobilesessionStarted: boolean = false;

  public productStateService = inject(ProductStateService);
  public router = inject(Router);
  private toast = inject(ToastrService);
  private sseService = inject(SseService);
  private productApiService = inject(ProductApiService);

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

  convertPropertiesWithShortAddress(properties: Property[]) {
    this.productStateService.setProperties(
      properties.map((property) => {
        const place = (property as any)['location'][0];
        const district = (property as any)['location'][1];
        const region = (property as any)['location'][2];
        const publishedDate = (property as any)['updatedAt'];
        property.dateListed = publishedDate;
        return { ...property, place, district, region };
      }),
    );
  }
  listenToBackendEvents() {
    return this.sseService.notification$.subscribe({
      next: (message) => {
        var cleanMessage = message.replace(/^"|"$/g, '');
        switch (cleanMessage) {
          case 'Mobile session started':
            this.mobilesessionStarted = true;
            this.updateComponent(message);
            break;
          case 'Media updated':
            this.fetchUpdatedProperty();
            this.updateComponent(message);
            break;
          default:
            console.log('Received SSE message:', cleanMessage);
        }
      },
      error: (err) => console.error('SSE subscription error:', err),
      complete: () => console.warn('SSE subscription completed unexpectedly'),
    });
  }

  fetchUpdatedProperty() {
    this.productApiService
      .getPropertyById(this.productStateService.editingProperty()?.id as number)
      .subscribe({
        next: (property) => {
          this.productStateService.updateEditing(property);
        },
        error: (err) => {
          console.error('Error fetching updated property:', err);
        },
      });
  }

  updateComponent(message: string) {
    this.mobilesessionStarted = true;
    this.toast.info(message, 'Notification');
  }
}
