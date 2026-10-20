import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  CATEGORIES,
  MarketplaceCategory,
  MarketplaceCategoryDTO,
} from '../constants/categories';
import { PRODUCT_URL } from '../constants/urls';
import { I18nService } from '../i18n/i18n.service';
import { TranslationKey } from '../i18n/translations';

/**
 * Marketplace categories for the product-type picker.
 *
 * The local CATEGORIES list renders immediately and owns what only the frontend knows (icons and
 * accent colours); the backend then supplies the editable copy, ordering and availability. If the
 * request fails, the local list is used as is.
 */
@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  private i18n = inject(I18nService);

  readonly categories = signal<MarketplaceCategory[]>(CATEGORIES);

  constructor() {
    this.http.get<MarketplaceCategoryDTO[]>(`${PRODUCT_URL}/v1/category/all`).subscribe({
      next: (remote) => this.categories.set(this.merge(remote)),
      error: () => {
        // Keep the built-in list; the picker still works without the backend.
      },
    });
  }

  /**
   * Category copy in the current language. The backend text is admin-editable but English only, so
   * it is used as is for English and the built-in translation is used for Uzbek and Russian.
   */
  text(category: MarketplaceCategory, field: 'title' | 'tagline' | 'description'): string {
    if (this.i18n.lang() === 'en') return category[field];
    return this.i18n.t(`category.${category.slug}.${field}` as TranslationKey);
  }

  private merge(remote: MarketplaceCategoryDTO[]): MarketplaceCategory[] {
    const bySlug = new Map(remote.map((dto) => [dto.slug, dto]));
    return CATEGORIES.filter((local) => bySlug.has(local.slug))
      .map((local) => {
        const dto = bySlug.get(local.slug)!;
        return {
          ...local,
          title: dto.title ?? local.title,
          tagline: dto.tagline ?? local.tagline,
          description: dto.description ?? local.description,
          // Live only when the backend enables it AND this app has a screen for it.
          available: dto.available && local.available,
          listingCount: dto.listingCount,
          sortOrder: dto.sortOrder,
        };
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
}
