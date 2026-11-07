import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PRODUCT_URL } from '../constants/urls';
import { MonthlyCount } from './dashboard.service';

export type ListingKind = 'PROPERTY' | 'CAR' | 'SECOND_HAND' | 'SERVICE';
export type StatisticsSort = 'views' | 'saves' | 'shares';

export interface ListingStatistics {
  kind: ListingKind;
  id: number;
  title: string | null;
  agent: string | null;
  listingStatus: string;
  views: number;
  saves: number;
  shares: number;
}

export interface EngagementStats {
  listings: number;
  views: number;
  saves: number;
  shares: number;
  savesPerMonth: MonthlyCount[];
  sharesPerMonth: MonthlyCount[];
  topListings: ListingStatistics[];
}

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private http = inject(HttpClient);

  /** Scoped by the backend: agents get their own listings, admins get everything. */
  getStats(kind: ListingKind | null, sort: StatisticsSort): Observable<EngagementStats> {
    const params: Record<string, string> = { sort };
    if (kind) params['kind'] = kind;
    return this.http.get<EngagementStats>(`${PRODUCT_URL}/v1/engagement/stats`, { params });
  }
}
