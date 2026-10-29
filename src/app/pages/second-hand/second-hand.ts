import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddEditSecondHand } from '../../components/second-hand-models/add-edit-second-hand/add-edit-second-hand';
import { ViewSecondHand } from '../../components/second-hand-models/view-second-hand/view-second-hand';
import {
  SecondHandFilter,
  SecondHandItem,
  SecondHandStats,
} from '../../shared/models/second-hand';
import { Property } from '../../shared/models/properties';
import { SecondHandApiService } from '../../shared/services/second-hand/second-hand-api.service';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';
import { ListingKindService } from '../../shared/services/product/listing-kind.service';
import { ListingStatus, OccupancyStatus } from '../../shared/enums/PropertyStatus';
import { SecondHandCategory } from '../../shared/enums/SecondHand';
import { Common } from '../../shared/common';
import { EnvironmentTs } from '../../environments/environment';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-second-hand',
  imports: [CommonModule, FormsModule, ModalComponent, AddEditSecondHand, ViewSecondHand, TranslatePipe],
  templateUrl: './second-hand.html',
  styleUrl: '../properties/properties.scss',
})
export class SecondHand implements OnInit, OnDestroy {
  private itemApi = inject(SecondHandApiService);
  private productState = inject(ProductStateService);
  private listingKind = inject(ListingKindService);
  private toast = inject(ToastrService);
  private i18n = inject(I18nService);
  private ctr = inject(ChangeDetectorRef);
  public common = inject(Common);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly statuses = Object.values(ListingStatus);
  readonly subCategories = Object.values(SecondHandCategory);

  items: SecondHandItem[] = [];
  stats: SecondHandStats | null = null;
  filter: SecondHandFilter = { search: '', listingStatus: null, subCategory: null };
  page = 0;
  totalPages = 0;
  totalCount = 0;

  isAddEditVisible = false;
  viewedItem: SecondHandItem | null = null;

  ngOnInit() {
    // The shared photo components upload to whatever kind this says.
    this.listingKind.kind.set('second-hand');
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
      error: () => this.toast.error(this.i18n.t('secondHand.statsError'), this.i18n.t('common.error')),
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
      error: () => this.toast.error(this.i18n.t('secondHand.loadError'), this.i18n.t('common.error')),
    });
  }

  onFilterChange(field: 'listingStatus' | 'subCategory', value: string) {
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

  edit(item: SecondHandItem) {
    // The shared photo components read id and medias from the editing slot.
    this.productState.startEditing(item as unknown as Property);
    this.isAddEditVisible = true;
  }

  view(item: SecondHandItem) {
    this.viewedItem = item;
  }

  closeModals() {
    this.isAddEditVisible = false;
    this.viewedItem = null;
    this.productState.clearEditing();
  }

  delete(item: SecondHandItem) {
    if (!confirm(this.i18n.t('secondHand.confirmDelete'))) return;
    this.itemApi.delete(item.id).subscribe({
      next: () => {
        this.toast.info(this.i18n.t('secondHand.deleted'), this.i18n.t('common.info'));
        this.refresh();
      },
      error: () => this.toast.error(this.i18n.t('secondHand.deleteError'), this.i18n.t('common.error')),
    });
  }

  isSold(item: SecondHandItem): boolean {
    return item.occupancyStatus === OccupancyStatus.SOLD;
  }

  /**
   * One-click flip between on-sale and sold. Only occupancyStatus is sent; the backend ignores
   * nulls, so the rest of the item is left exactly as it is.
   */
  toggleSold(item: SecondHandItem) {
    const occupancyStatus = this.isSold(item) ? OccupancyStatus.AVAILABLE : OccupancyStatus.SOLD;
    this.itemApi.update(item.id, { occupancyStatus }).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('secondHand.saved'));
        this.refresh();
      },
      error: () => this.toast.error(this.i18n.t('secondHand.saveError'), this.i18n.t('common.error')),
    });
  }

  coverImage(item: SecondHandItem): string {
    const cover = item.medias?.find((m) => m.isCoverImage) ?? item.medias?.[0];
    return cover?.mediaUrl ?? `${EnvironmentTs.MEDIA_URL}/real-estate-media/default/house.png`;
  }

  itemName(item: SecondHandItem): string {
    return item.title || `#${item.id}`;
  }

  place(item: SecondHandItem): string {
    return (item.location ?? []).slice(0, 3).filter(Boolean).join(' • ');
  }
}
