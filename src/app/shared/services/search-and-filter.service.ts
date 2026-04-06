import { inject, Injectable } from '@angular/core';
import { PropertyFilter } from '../models/properties';
import { PaginationService } from './pagination.service';
import { ProductStateService } from './product/state/product-state.service';
import { ProductApiService } from './product/state/product-api.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class SearchAndFilterService {
  search = '';
  filter: PropertyFilter = {
    search: '',
    listingStatus: null,
    type: null,
  };

  public pagination = inject(PaginationService);
  private productApiService = inject(ProductApiService);
  private toast = inject(ToastrService);

  onFilterChange(field: keyof PropertyFilter, $event: any) {
    const value = $event.target.value === 'all' ? '' : $event.target.value;
    if (field === 'search') {
      this.filter.search = this.search;
    } else {
      this.filter = { ...this.filter, [field]: value };
    }
    this.filterProperties();
  }

  filterProperties() {
    if (Object.values(this.filter).every((v) => v === '' || v === null)) {
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
          return { ...properties.content, ...this.pagination };
        },
        error: () => {
          this.toast.error('Error filtering properties', 'Error');
        },
      });
  }
}
