import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ColumnChart, ColumnDatum } from '../../components/column-chart/column-chart';
import { Common } from '../../shared/common';
import { I18nService } from '../../shared/i18n/i18n.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { TranslationKey } from '../../shared/i18n/translations';
import { AuthService } from '../../account/auth.service';
import { MonthlyCount } from '../../shared/services/dashboard.service';
import {
  EngagementStats,
  ListingKind,
  StatisticsService,
  StatisticsSort,
} from '../../shared/services/statistics.service';

/** Views, saves and shares across listings. Agents see their own; admins and managers see all. */
@Component({
  selector: 'app-statistics',
  imports: [ColumnChart, TranslatePipe],
  templateUrl: './statistics.html',
  styleUrl: '../dashboard/dashboard.scss',
})
export class Statistics {
  private statisticsService = inject(StatisticsService);
  private i18n = inject(I18nService);
  private auth = inject(AuthService);
  readonly common = inject(Common);

  readonly kinds: (ListingKind | null)[] = [null, 'PROPERTY', 'CAR', 'SECOND_HAND', 'SERVICE'];
  readonly sortColumns: { key: StatisticsSort; label: TranslationKey }[] = [
    { key: 'views', label: 'stats.views' },
    { key: 'saves', label: 'stats.saves' },
    { key: 'shares', label: 'stats.shares' },
  ];
  readonly seesEveryone = (this.auth.getUserDataFromStorage()?.authorities ?? []).some(
    (role) => role === 'ADMIN' || role === 'MANAGER',
  );

  readonly kind = signal<ListingKind | null>(null);
  readonly sort = signal<StatisticsSort>('views');
  readonly chartSeries = signal<'saves' | 'shares'>('saves');
  readonly stats = signal<EngagementStats | null>(null);
  readonly loadError = signal(false);
  private request?: Subscription;

  readonly chartData = computed<ColumnDatum[]>(() => {
    const stats = this.stats();
    if (!stats) return [];
    const months = this.chartSeries() === 'saves' ? stats.savesPerMonth : stats.sharesPerMonth;
    return months.map((m) => this.toColumn(m));
  });
  readonly chartTotal = computed(() => this.chartData().reduce((sum, d) => sum + d.value, 0));
  readonly chartValueText = computed(() => {
    const key = this.chartSeries() === 'saves' ? 'stats.savesValue' : 'stats.sharesValue';
    this.i18n.lang();
    return (count: number) => this.i18n.t(key, { count });
  });

  constructor() {
    effect(() => {
      const kind = this.kind();
      const sort = this.sort();
      untracked(() => this.load(kind, sort));
    });
  }

  kindLabel(kind: ListingKind | null): TranslationKey {
    return kind ? (`stats.${kind}` as TranslationKey) : 'stats.all';
  }

  private load(kind: ListingKind | null, sort: StatisticsSort) {
    this.request?.unsubscribe();
    this.request = this.statisticsService.getStats(kind, sort).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loadError.set(false);
      },
      error: () => this.loadError.set(true),
    });
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
}
