import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Property } from './models/properties';
import { ProductStateService } from './services/product/state/product-state.service';

@Injectable({
  providedIn: 'root',
})
export class Common {
  activeMenuItem: string = '';

  public productStateService = inject(ProductStateService);
  public router = inject(Router);

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
}
