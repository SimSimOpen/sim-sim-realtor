import { inject, Injectable } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { PropertyFilter } from '../models/properties';
import { PaginationService } from './pagination.service';
import { ProductApiService } from './product/state/product-api.service';
import { ToastrService } from 'ngx-toastr';
import { Common } from '../common';

@Injectable({
  providedIn: 'root',
})
export class SearchAndFilterService {
  search = '';
  public filter: PropertyFilter = {
    search: '',
    listingStatus: null,
    type: null,
  };

  public pagination = inject(PaginationService);
  private productApiService = inject(ProductApiService);
  private toast = inject(ToastrService);
  private i18n = inject(I18nService);
  private common = inject(Common);

  onFilterChange(field: keyof PropertyFilter, $event: any) {
    const value = $event.target.value === 'all' ? '' : $event.target.value;
    this.filter = { ...this.filter, [field]: value };
    this.filterProperties();
  }

  filterProperties() {
    if (Object.values(this.filter).every((v) => v === '' || v === null)) {
      this.common.productStateService.fetchProperties(
        this.pagination.page,
        this.pagination.size,
        this.pagination.sort,
      );
      return;
    }
    this.productApiService
      .filterProperties(
        this.filter,
        this.pagination.page,
        this.pagination.size,
        this.pagination.sort,
      )
      .subscribe({
        next: (properties) => {
          this.pagination.totalCounts = properties.totalElements;
          this.pagination.totalPages = properties.totalPages;
          this.common.convertPropertiesWithShortAddress(properties.content);
        },
        error: () => {
          this.toast.error(this.i18n.t('properties.filterError'), this.i18n.t('common.error'));
        },
      });
  }
  get filterIsActive() {
    return Object.values(this.filter).some((v) => v !== '' && v !== null);
  }
}
