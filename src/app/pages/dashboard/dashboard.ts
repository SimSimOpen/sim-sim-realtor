import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { Common } from '../../shared/common';
import { BaseModalComponent } from '../../components/modal/baseModal';
import { ModalComponent } from '../../components/modal/modal.component';
import { CategoryIcon } from '../../components/category-icon';
import { ViewProperty } from '../../components/view-property-models/view-property/view-property';
import { ViewCar } from '../../components/car-models/view-car/view-car';
import { ViewSecondHand } from '../../components/second-hand-models/view-second-hand/view-second-hand';
import { ViewServices } from '../../components/services-models/view-services/view-services';
import { ColumnChart, ColumnDatum } from '../../components/column-chart/column-chart';
import { ProductApiService } from '../../shared/services/product/state/product-api.service';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';
import { CarApiService } from '../../shared/services/car/car-api.service';
import { SecondHandApiService } from '../../shared/services/second-hand/second-hand-api.service';
import { ServicesApiService } from '../../shared/services/services/services-api.service';
import {
  ActivityItem,
  DashboardService,
  ListingDashboard,
  MonthlyCount,
  PresenceStats,
  UserDashboard,
} from '../../shared/services/dashboard.service';
import { AuthService } from '../../account/auth.service';
import { Property } from '../../shared/models/properties';
import { Car } from '../../shared/models/cars';
import { SecondHandItem } from '../../shared/models/second-hand';
import { ServiceItem } from '../../shared/models/services';
import { PriceMode } from '../../shared/enums/Services';
import { EnvironmentTs } from '../../environments/environment';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';
import { CategoryService } from '../../shared/services/category.service';
import { CategorySlug, findCategory, SECTION_ROUTES } from '../../shared/constants/categories';

const RECENT_PRODUCTS = 5;
const ACTIVITY_ITEMS = 8;
/** Matches the frontends' heartbeat, so the number is never more than one beat stale. */
const PRESENCE_REFRESH_MS = 30_000;

/** The property DTO carries these too, but the shared Property model does not declare them. */
type PropertyListing = Property & { createdAt?: string; updatedAt?: string | null; location?: string[] };

/** One row of the latest-products table; `kind` says which API and view modal it belongs to. */
type RecentProduct =
  | { kind: 'property'; slug: 'real-estate'; item: PropertyListing }
  | { kind: 'car'; slug: 'cars'; item: Car }
  | { kind: 'second-hand'; slug: 'second-hand'; item: SecondHandItem }
  | { kind: 'services'; slug: 'services'; item: ServiceItem };

@Component({
  selector: 'app-dashboard',
  imports: [
    ModalComponent,
    CommonModule,
    ViewProperty,
    ViewCar,
    ViewSecondHand,
    ViewServices,
    TranslatePipe,
    ColumnChart,
    CategoryIcon,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard extends BaseModalComponent implements OnInit {
  isTypePickerVisible = false;
  isViewPropertyModalVisible = false;
  viewedCar: Car | null = null;
  viewedSecondHand: SecondHandItem | null = null;
  viewedService: ServiceItem | null = null;

  public common = inject(Common);
  private productApiService = inject(ProductApiService);
  private carApi = inject(CarApiService);
  private secondHandApi = inject(SecondHandApiService);
  private servicesApi = inject(ServicesApiService);
  private productStateService = inject(ProductStateService);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private i18n = inject(I18nService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public categoryService = inject(CategoryService);

  /** The types offered by the dashboard's Add Product picker, in display order. */
  private readonly pickerSlugs: CategorySlug[] = ['real-estate', 'cars', 'second-hand', 'services'];

  get pickerCategories() {
    return this.categoryService.categories().filter((c) => this.pickerSlugs.includes(c.slug));
  }

  /** Account numbers are admin-only on the backend, so agents never ask for them. */
  readonly isAdmin = this.authService.isAdminRole();

  listings = signal<ListingDashboard | null>(null);
  users = signal<UserDashboard | null>(null);
  presence = signal<PresenceStats | null>(null);
  loadError = signal(false);
  chartSeries = signal<'listings' | 'signups'>('listings');
  recentProducts = signal<RecentProduct[]>([]);

  readonly chartData = computed<ColumnDatum[]>(() => {
    const months =
      this.chartSeries() === 'signups'
        ? (this.users()?.signupsPerMonth ?? [])
        : (this.listings()?.createdPerMonth ?? []);
    return months.map((m) => this.toColumn(m));
  });

  readonly chartTotal = computed(() => this.chartData().reduce((sum, d) => sum + d.value, 0));

  readonly chartValueText = computed(() => {
    const key = this.chartSeries() === 'signups' ? 'dash.signupsValue' : 'dash.listingsValue';
    this.i18n.lang();
    return (count: number) => this.i18n.t(key, { count });
  });

  readonly typeMax = computed(() => Math.max(1, ...(this.listings()?.byType ?? []).map((t) => t.count)));

  /** Listing and account events merged into one feed, newest first. */
  readonly activity = computed<ActivityItem[]>(() =>
    [...(this.listings()?.activity ?? []), ...(this.users()?.activity ?? [])]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, ACTIVITY_ITEMS),
  );

  ngOnInit() {
    this.loadDashboard();
    this.fetchRecentProducts();
    if (this.isAdmin) {
      this.loadPresence();
      const timer = setInterval(() => !document.hidden && this.loadPresence(), PRESENCE_REFRESH_MS);
      this.destroyRef.onDestroy(() => clearInterval(timer));
    }
    // Arriving from the client app's "Post ad" button: open the Add Product picker straight away.
    if (this.route.snapshot.queryParamMap.get('add') === '1') {
      this.openModal();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { add: null },
        replaceUrl: true,
      });
    }
  }

  loadPresence() {
    this.dashboardService.getPresence().subscribe({
      next: (stats) => this.presence.set(stats),
      // Keep the last number on a blip; the tile shows a dash until the first success.
      error: () => undefined,
    });
  }

  loadDashboard() {
    this.loadError.set(false);
    this.dashboardService.getListings().subscribe({
      next: (data) => this.listings.set(data),
      error: () => this.loadError.set(true),
    });
    if (this.isAdmin) {
      this.dashboardService.getUsers().subscribe({
        next: (data) => this.users.set(data),
        error: () => this.loadError.set(true),
      });
    }
  }

  /**
   * There is no cross-category endpoint, so take the newest few of each type and merge them: the
   * overall newest rows are always among those. A type that fails to load only drops its own rows.
   */
  fetchRecentProducts() {
    const sort = 'createdAt,desc';
    const load = (rows: Observable<RecentProduct[]>) =>
      rows.pipe(
        catchError((error) => {
          console.error('Error fetching recent products:', error);
          return of<RecentProduct[]>([]);
        }),
      );
    forkJoin([
      load(
        this.productApiService.getAgentsProperties(0, RECENT_PRODUCTS, sort).pipe(
          map((page) =>
            page.content.map((item: PropertyListing): RecentProduct => {
              item.dateListed = item.updatedAt ?? item.createdAt;
              item.address = item.location?.[3] || '';
              return { kind: 'property', slug: 'real-estate', item };
            }),
          ),
        ),
      ),
      load(
        this.carApi
          .list({ search: '', listingStatus: null, bodyType: null }, 0, RECENT_PRODUCTS, sort)
          .pipe(map((page) => page.content.map((item): RecentProduct => ({ kind: 'car', slug: 'cars', item })))),
      ),
      load(
        this.secondHandApi
          .list({ search: '', listingStatus: null, subCategory: null }, 0, RECENT_PRODUCTS, sort)
          .pipe(
            map((page) =>
              page.content.map((item): RecentProduct => ({ kind: 'second-hand', slug: 'second-hand', item })),
            ),
          ),
      ),
      load(
        this.servicesApi
          .list({ search: '', listingStatus: null, kind: null, category: null }, 0, RECENT_PRODUCTS, sort)
          .pipe(
            map((page) =>
              page.content.map((item): RecentProduct => ({ kind: 'services', slug: 'services', item })),
            ),
          ),
      ),
    ]).subscribe((groups) => {
      const addedAt = (row: RecentProduct) => new Date(row.item.createdAt ?? 0).getTime();
      this.recentProducts.set(
        groups
          .flat()
          .sort((a, b) => addedAt(b) - addedAt(a))
          .slice(0, RECENT_PRODUCTS),
      );
    });
  }

  productCategory(row: RecentProduct): string {
    const category = findCategory(row.slug);
    return category ? this.categoryService.text(category, 'title') : '';
  }

  productTitle(row: RecentProduct): string {
    if (row.kind === 'car') {
      const name = [row.item.brand, row.item.model, row.item.year].filter(Boolean).join(' ');
      if (name) return name;
    }
    return row.item.title || this.i18n.t('dash.untitledDraft', { id: row.item.id ?? '' });
  }

  productPlace(row: RecentProduct): string {
    const location = row.item.location ?? [];
    return location[3] || location.slice(0, 3).filter(Boolean).join(' • ');
  }

  productSubtype(row: RecentProduct): string {
    switch (row.kind) {
      case 'property':
        return this.common.formatEnum(row.item.type);
      case 'car':
        return this.common.formatEnum(row.item.bodyType);
      case 'second-hand':
        return this.common.formatEnum(row.item.subCategory);
      case 'services':
        return this.common.formatEnum(row.item.category);
    }
  }

  productDetails(row: RecentProduct): string {
    switch (row.kind) {
      case 'property':
        return `${row.item.numberOfRooms ?? '—'} / ${row.item.floor ?? '—'} / ${row.item.totalFloors ?? '—'}`;
      case 'car':
        return [
          row.item.mileage != null
            ? `${row.item.mileage.toLocaleString(this.i18n.lang())} ${this.i18n.t('cars.km')}`
            : '',
          this.common.formatEnum(row.item.transmission),
        ]
          .filter(Boolean)
          .join(' · ');
      case 'second-hand':
        return this.common.formatEnum(row.item.condition);
      case 'services':
        return this.common.formatEnum(row.item.kind);
    }
  }

  productPrice(row: RecentProduct): string {
    if (row.kind === 'services' && (row.item.price == null || row.item.priceMode === PriceMode.NEGOTIABLE)) {
      return this.i18n.t('services.negotiable');
    }
    if (row.item.price == null) return '';
    const amount = `$${row.item.price.toLocaleString(this.i18n.lang())}`;
    return row.kind === 'services' && row.item.priceMode === PriceMode.HOURLY
      ? `${amount} ${this.i18n.t('services.perHour')}`
      : amount;
  }

  activityText(item: ActivityItem): string {
    const title = item.title || this.i18n.t('dash.untitledDraft', { id: item.refId });
    const name = item.actor || '—';
    switch (item.type) {
      case 'LISTING_CREATED':
        return this.i18n.t('activity.listingCreated', { title });
      case 'LISTING_UPDATED':
        return this.i18n.t('activity.listingUpdated', { title });
      case 'USER_REGISTERED':
        return this.i18n.t('activity.userRegistered', { name });
      case 'AGENT_CREATED':
        return this.i18n.t('activity.agentCreated', { name });
      case 'AGENT_DEACTIVATED':
        return this.i18n.t('activity.agentDeactivated', { name });
    }
  }

  activityDot(item: ActivityItem): string {
    return item.type.startsWith('LISTING')
      ? 'bg-blue-600'
      : item.type === 'AGENT_DEACTIVATED'
        ? 'bg-gray-400'
        : 'bg-emerald-600';
  }

  /** "5 minutes ago", "yesterday", … in the UI language. */
  timeAgo(iso: string): string {
    const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ['year', 31536000],
      ['month', 2592000],
      ['week', 604800],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
    ];
    const format = new Intl.RelativeTimeFormat(this.i18n.lang(), { numeric: 'auto' });
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
    }
    return format.format(0, 'minute');
  }

  private toColumn(m: MonthlyCount): ColumnDatum {
    const [year, month] = m.month.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const lang = this.i18n.lang();
    return {
      label: new Intl.DateTimeFormat(lang, { month: 'short' }).format(date),
      fullLabel: new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(date),
      value: m.count,
    };
  }

  productCover(row: RecentProduct): string {
    const medias = row.item.medias;
    const cover = medias?.find((media) => media.isCoverImage === true) ?? medias?.[0];
    return cover?.mediaUrl ?? `${EnvironmentTs.MEDIA_URL}/real-estate-media/default/house.png`;
  }

  override openModal(): void {
    this.isTypePickerVisible = true;
  }

  /**
   * Adding happens on the product's own manage page, so picking a type lands there with its
   * add form already open (`?new=1` is consumed and cleared by that page).
   */
  chooseType(slug: CategorySlug) {
    this.isTypePickerVisible = false;
    const route = SECTION_ROUTES[slug];
    if (route) this.router.navigate([route], { queryParams: { new: '1' } });
  }

  override closeModal(): void {
    this.isTypePickerVisible = false;
    this.isViewPropertyModalVisible = false;
    this.viewedCar = null;
    this.viewedSecondHand = null;
    this.viewedService = null;
    this.productStateService.clearEditing();
      // A product may have been added or changed in the modal.
    this.loadDashboard();
    this.fetchRecentProducts();
  }

  openProduct(row: RecentProduct): void {
    switch (row.kind) {
      case 'property':
        this.productStateService.startEditing(row.item);
        this.isViewPropertyModalVisible = true;
        break;
      case 'car':
        this.viewedCar = row.item;
        break;
      case 'second-hand':
        this.viewedSecondHand = row.item;
        break;
      case 'services':
        this.viewedService = row.item;
        break;
    }
  }
}
