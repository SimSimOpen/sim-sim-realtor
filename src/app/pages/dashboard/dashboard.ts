import { ChangeDetectorRef, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Common } from '../../shared/common';
import { BaseModalComponent } from '../../components/modal/baseModal';
import { ModalComponent } from '../../components/modal/modal.component';
import { CategoryIcon } from '../../components/category-icon';
import { ViewProperty } from '../../components/view-property-models/view-property/view-property';
import { ColumnChart, ColumnDatum } from '../../components/column-chart/column-chart';
import { ProductApiService } from '../../shared/services/product/state/product-api.service';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';
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
import { EnvironmentTs } from '../../environments/environment';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';
import { CategoryService } from '../../shared/services/category.service';
import { CategorySlug, SECTION_ROUTES } from '../../shared/constants/categories';

const RECENT_PROPERTIES = 5;
const ACTIVITY_ITEMS = 8;
/** Matches the frontends' heartbeat, so the number is never more than one beat stale. */
const PRESENCE_REFRESH_MS = 30_000;

@Component({
  selector: 'app-dashboard',
  imports: [ModalComponent, CommonModule, ViewProperty, TranslatePipe, ColumnChart, CategoryIcon],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard extends BaseModalComponent implements OnInit {
  isTypePickerVisible = false;
  isViewPropertyModalVisible = false;

  public common = inject(Common);
  private productApiService = inject(ProductApiService);
  private productStateService = inject(ProductStateService);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private i18n = inject(I18nService);
  private ctr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  public categoryService = inject(CategoryService);

  /** The types offered by the dashboard's Add Product picker, in display order. */
  private readonly pickerSlugs: CategorySlug[] = ['real-estate', 'cars', 'second-hand', 'services'];

  get pickerCategories() {
    return this.categoryService.categories().filter((c) => this.pickerSlugs.includes(c.slug));
  }

  /** Account numbers are admin-only on the backend, so agents never ask for them. */
  readonly isAdmin = (this.authService.getUserDataFromStorage()?.authorities ?? []).some(
    (role) => role === 'ADMIN' || role === 'MANAGER',
  );

  listings = signal<ListingDashboard | null>(null);
  users = signal<UserDashboard | null>(null);
  presence = signal<PresenceStats | null>(null);
  loadError = signal(false);
  chartSeries = signal<'listings' | 'signups'>('listings');
  recentProperties: Property[] = [];

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
    this.fetchRecentProperties();
    if (this.isAdmin) {
      this.loadPresence();
      const timer = setInterval(() => !document.hidden && this.loadPresence(), PRESENCE_REFRESH_MS);
      this.destroyRef.onDestroy(() => clearInterval(timer));
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

  fetchRecentProperties() {
    this.productApiService.getAgentsProperties(0, RECENT_PROPERTIES, 'createdAt,desc').subscribe({
      next: (properties) => {
        this.recentProperties = properties.content.map((property) => {
          property.dateListed = (property as any)['updatedAt'] ?? (property as any)['createdAt'];
          property.address = (property as any)['location']?.[3] || '';
          return property;
        });
        this.ctr.detectChanges();
      },
      error: (error) => console.error('Error fetching properties:', error),
    });
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

  getPropertiesCoverImage(property: Property) {
    const defaultPath = `${EnvironmentTs.MEDIA_URL}/real-estate-media/default/house.png`;
    const cover = property.medias?.find((media) => media.isCoverImage === true);
    return cover ? cover.mediaUrl : defaultPath;
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
    this.productStateService.clearEditing();
    // A property may have been added or changed in the modal.
    this.loadDashboard();
    this.fetchRecentProperties();
  }

  openViewPropertyModal(property: Property): void {
    this.productStateService.startEditing(property);
    this.isViewPropertyModalVisible = true;
  }
}
