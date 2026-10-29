import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddEditServices } from '../../components/services-models/add-edit-services/add-edit-services';
import { ViewServices } from '../../components/services-models/view-services/view-services';
import { ServiceFilter, ServiceItem, ServiceStats } from '../../shared/models/services';
import { Property } from '../../shared/models/properties';
import { ServicesApiService } from '../../shared/services/services/services-api.service';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';
import { ListingKindService } from '../../shared/services/product/listing-kind.service';
import { ListingStatus } from '../../shared/enums/PropertyStatus';
import { PriceMode, ServiceCategory, ServiceKind } from '../../shared/enums/Services';
import { Common } from '../../shared/common';
import { EnvironmentTs } from '../../environments/environment';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-services',
  imports: [CommonModule, FormsModule, ModalComponent, AddEditServices, ViewServices, TranslatePipe],
  templateUrl: './services.html',
  styleUrl: '../properties/properties.scss',
})
export class Services implements OnInit, OnDestroy {
  private itemApi = inject(ServicesApiService);
  private productState = inject(ProductStateService);
  private listingKind = inject(ListingKindService);
  private toast = inject(ToastrService);
  private i18n = inject(I18nService);
  private ctr = inject(ChangeDetectorRef);
  public common = inject(Common);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly statuses = Object.values(ListingStatus);
  readonly kinds = Object.values(ServiceKind);
  readonly categories = Object.values(ServiceCategory);

  items: ServiceItem[] = [];
  stats: ServiceStats | null = null;
  filter: ServiceFilter = { search: '', listingStatus: null, kind: null, category: null };
  page = 0;
  totalPages = 0;
  totalCount = 0;

  isAddEditVisible = false;
  viewedItem: ServiceItem | null = null;

  ngOnInit() {
    // The shared photo components upload to whatever kind this says.
    this.listingKind.kind.set('services');
    this.refresh();
    // Arriving from the dashboard's Add Product picker: open the add form straight away.
    if (this.route.snapshot.queryParamMap.get('new') === '1') {
      this.openAdd();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { new: null },
        replaceUrl: true,
      });
    }
  }

  ngOnDestroy() {
    this.listingKind.kind.set('property');
    this.productState.clearEditing();
  }

  refresh() {
    this.fetchItems();
    this.itemApi.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.ctr.detectChanges();
      },
      error: () => this.toast.error(this.i18n.t('services.statsError'), this.i18n.t('common.error')),
    });
  }

  fetchItems() {
    this.itemApi.list(this.filter, this.page, PAGE_SIZE, 'createdAt,desc').subscribe({
      next: (page) => {
        this.items = page.content;
        this.totalPages = page.totalPages;
        this.totalCount = page.totalElements;
        this.ctr.detectChanges();
      },
      error: () => this.toast.error(this.i18n.t('services.loadError'), this.i18n.t('common.error')),
    });
  }

  onFilterChange(field: 'listingStatus' | 'kind' | 'category', value: string) {
    this.filter = { ...this.filter, [field]: value === 'all' ? null : value };
    this.page = 0;
    this.fetchItems();
  }

  onSearch() {
    this.filter = { ...this.filter, search: this.filter.search.trim() };
    this.page = 0;
    this.fetchItems();
  }

  prevPage() {
    if (this.page === 0) return;
    this.page--;
    this.fetchItems();
  }

  nextPage() {
    if (this.page + 1 >= this.totalPages) return;
    this.page++;
    this.fetchItems();
  }

  get range() {
    if (!this.totalCount) return { from: 0, to: 0, total: 0 };
    return {
      from: this.page * PAGE_SIZE + 1,
      to: Math.min((this.page + 1) * PAGE_SIZE, this.totalCount),
      total: this.totalCount,
    };
  }

  openAdd() {
    this.productState.clearEditing();
    this.isAddEditVisible = true;
  }

  /** Back to the product-type picker this section was opened from. */
  backToProducts() {
    this.router.navigate(['/products']);
  }

  edit(item: ServiceItem) {
    // The shared photo components read id and medias from the editing slot.
    this.productState.startEditing(item as unknown as Property);
    this.isAddEditVisible = true;
  }

  view(item: ServiceItem) {
    this.viewedItem = item;
  }

  closeModals() {
    this.isAddEditVisible = false;
    this.viewedItem = null;
    this.productState.clearEditing();
  }

  delete(item: ServiceItem) {
    if (!confirm(this.i18n.t('services.confirmDelete'))) return;
    this.itemApi.delete(item.id).subscribe({
      next: () => {
        this.toast.info(this.i18n.t('services.deleted'), this.i18n.t('common.info'));
        this.refresh();
      },
      error: () => this.toast.error(this.i18n.t('services.deleteError'), this.i18n.t('common.error')),
    });
  }

  /** Someone needing a service reads the price as their budget, so it is labelled as one. */
  isSeeking(item: ServiceItem): boolean {
    return item.kind === ServiceKind.SEEKING;
  }

  kindClasses(item: ServiceItem): string {
    return this.isSeeking(item)
      ? 'bg-amber-50 text-amber-700 border border-amber-200'
      : 'bg-blue-50 text-blue-700 border border-blue-200';
  }

  /** "$500", "$40 /hr" or "Negotiable" (also used when there is no price at all). */
  priceLabel(item: ServiceItem): string {
    if (item.price == null || item.priceMode === PriceMode.NEGOTIABLE) {
      return this.i18n.t('services.negotiable');
    }
    const amount = `$${item.price.toLocaleString(this.i18n.lang())}`;
    return item.priceMode === PriceMode.HOURLY
      ? `${amount} ${this.i18n.t('services.perHour')}`
      : amount;
  }

  /** Column/field caption: a SEEKING listing's amount is the poster's budget. */
  priceCaption(item: ServiceItem): string {
    return this.i18n.t(this.isSeeking(item) ? 'services.budget' : 'services.price');
  }

  coverImage(item: ServiceItem): string {
    const cover = item.medias?.find((m) => m.isCoverImage) ?? item.medias?.[0];
    // Services listings may have no photos at all, so the shared placeholder stands in.
    return cover?.mediaUrl ?? `${EnvironmentTs.MEDIA_URL}/real-estate-media/default/house.png`;
  }

  itemName(item: ServiceItem): string {
    return item.title || `#${item.id}`;
  }

  place(item: ServiceItem): string {
    return (item.location ?? []).slice(0, 3).filter(Boolean).join(' • ');
  }
}
