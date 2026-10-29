import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddEditCar } from '../../components/car-models/add-edit-car/add-edit-car';
import { ViewCar } from '../../components/car-models/view-car/view-car';
import { Car, CarFilter, CarsStats } from '../../shared/models/cars';
import { Property } from '../../shared/models/properties';
import { CarApiService } from '../../shared/services/car/car-api.service';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';
import { ListingKindService } from '../../shared/services/product/listing-kind.service';
import { ListingStatus } from '../../shared/enums/PropertyStatus';
import { CarBodyType } from '../../shared/enums/CarStatus';
import { Common } from '../../shared/common';
import { EnvironmentTs } from '../../environments/environment';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-cars',
  imports: [CommonModule, FormsModule, ModalComponent, AddEditCar, ViewCar, TranslatePipe],
  templateUrl: './cars.html',
  styleUrl: '../properties/properties.scss',
})
export class Cars implements OnInit, OnDestroy {
  private carApi = inject(CarApiService);
  private productState = inject(ProductStateService);
  private listingKind = inject(ListingKindService);
  private toast = inject(ToastrService);
  private i18n = inject(I18nService);
  private ctr = inject(ChangeDetectorRef);
  public common = inject(Common);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly statuses = Object.values(ListingStatus);
  readonly bodyTypes = Object.values(CarBodyType);

  cars: Car[] = [];
  stats: CarsStats | null = null;
  filter: CarFilter = { search: '', listingStatus: null, bodyType: null };
  page = 0;
  totalPages = 0;
  totalCount = 0;

  isAddEditVisible = false;
  viewedCar: Car | null = null;

  ngOnInit() {
    // The shared photo components upload to whatever kind this says.
    this.listingKind.kind.set('car');
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
    this.fetchCars();
    this.carApi.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.ctr.detectChanges();
      },
      error: () => this.toast.error(this.i18n.t('cars.statsError'), this.i18n.t('common.error')),
    });
  }

  fetchCars() {
    this.carApi.list(this.filter, this.page, PAGE_SIZE, 'createdAt,desc').subscribe({
      next: (page) => {
        this.cars = page.content;
        this.totalPages = page.totalPages;
        this.totalCount = page.totalElements;
        this.ctr.detectChanges();
      },
      error: () => this.toast.error(this.i18n.t('cars.loadError'), this.i18n.t('common.error')),
    });
  }

  onFilterChange(field: 'listingStatus' | 'bodyType', value: string) {
    this.filter = { ...this.filter, [field]: value === 'all' ? null : value };
    this.page = 0;
    this.fetchCars();
  }

  onSearch() {
    this.filter = { ...this.filter, search: this.filter.search.trim() };
    this.page = 0;
    this.fetchCars();
  }

  prevPage() {
    if (this.page === 0) return;
    this.page--;
    this.fetchCars();
  }

  nextPage() {
    if (this.page + 1 >= this.totalPages) return;
    this.page++;
    this.fetchCars();
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

  edit(car: Car) {
    // The shared photo components read id and medias from the editing slot.
    this.productState.startEditing(car as unknown as Property);
    this.isAddEditVisible = true;
  }

  view(car: Car) {
    this.viewedCar = car;
  }

  closeModals() {
    this.isAddEditVisible = false;
    this.viewedCar = null;
    this.productState.clearEditing();
  }

  delete(car: Car) {
    if (!confirm(this.i18n.t('cars.confirmDelete'))) return;
    this.carApi.delete(car.id).subscribe({
      next: () => {
        this.toast.info(this.i18n.t('cars.deleted'), this.i18n.t('common.info'));
        this.refresh();
      },
      error: () => this.toast.error(this.i18n.t('cars.deleteError'), this.i18n.t('common.error')),
    });
  }

  coverImage(car: Car): string {
    const cover = car.medias?.find((m) => m.isCoverImage) ?? car.medias?.[0];
    return cover?.mediaUrl ?? `${EnvironmentTs.MEDIA_URL}/real-estate-media/default/house.png`;
  }

  carName(car: Car): string {
    return [car.brand, car.model, car.year].filter(Boolean).join(' ') || car.title || `#${car.id}`;
  }

  place(car: Car): string {
    return car.location.slice(0, 3).filter(Boolean).join(' • ');
  }
}
