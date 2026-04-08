import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Property } from './models/properties';
import { ProductStateService } from './services/product/state/product-state.service';
import { SseService } from './services/sse.service';
import { ProductApiService } from './services/product/state/product-api.service';
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from './services/global.service';
import { AuthService } from '../account/auth.service';

@Injectable({
  providedIn: 'root',
})
export class Common {
  activeMenuItem: string = '';

  public productStateService = inject(ProductStateService);
  public router = inject(Router);
  private toast = inject(ToastrService);
  private sseService = inject(SseService);
  private productApiService = inject(ProductApiService);
  private global = inject(GlobalService);
  private authService = inject(AuthService);

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
  listenToBackendEvents(onUpdate?: () => void) {
    console.log('initializing Upload from mobile');
    return this.sseService.notification$.subscribe({
      next: (message) => {
        var cleanMessage = message.replace(/^"|"$/g, '');
        switch (cleanMessage) {
          case 'Mobile session started':
            console.log('Mobile Session Started');
            this.global.mobilesessionStarted.set(true);
            this.toast.info(message, 'Notification');
            break;
          case 'Media updated':
            console.log('Media Updated');
            onUpdate?.();
            if (this.authService.isAuthenticated()) this.fetchUpdatedProperty();
            this.toast.info(message, 'Notification');
            break;
          default:
            console.log('Received SSE message:', cleanMessage);
        }
      },
      error: (err) => this.toast.error('SSE subscription error:', err),
      complete: () => this.toast.warning('SSE subscription completed unexpectedly'),
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
}
