import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AUTH_URL, PRODUCT_URL } from '../constants/urls';
import { EnvironmentTs } from '../../environments/environment';

export interface MonthlyCount {
  month: string; // yyyy-MM
  count: number;
}

export type ActivityType =
  | 'LISTING_CREATED'
  | 'LISTING_UPDATED'
  | 'USER_REGISTERED'
  | 'AGENT_CREATED'
  | 'AGENT_DEACTIVATED';

export interface ActivityItem {
  type: ActivityType;
  refId: number;
  title: string | null;
  actor: string | null;
  detail: string | null;
  at: string;
}

export interface ListingDashboard {
  total: number;
  active: number;
  draft: number;
  archived: number;
  available: number;
  rented: number;
  sold: number;
  totalViews: number;
  createdPerMonth: MonthlyCount[];
  byType: { type: string; count: number }[];
  mostViewed: { id: number; title: string | null; views: number; listingStatus: string }[];
  activity: ActivityItem[];
}

export interface UserDashboard {
  clients: number;
  agents: number;
  newClientsThisMonth: number;
  signupsPerMonth: MonthlyCount[];
  activity: ActivityItem[];
}

export interface PresenceStats {
  siteVisitors: number;
  siteSignedIn: number;
  adminOnline: number;
  windowSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  /** Scoped by the backend: agents get their own listings, admins get everything. */
  getListings(): Observable<ListingDashboard> {
    return this.http.get<ListingDashboard>(`${PRODUCT_URL}/v1/dashboard/listings`);
  }

  /** Who has the website / admin panel open right now. Admins and managers only. */
  getPresence(): Observable<PresenceStats> {
    return this.http.get<PresenceStats>(`${EnvironmentTs.URL}/api/event/presence/stats`);
  }

  /** Admins and managers only. */
  getUsers(): Observable<UserDashboard> {
    return this.http.get<UserDashboard>(`${AUTH_URL}/v1/admin/stats`);
  }
}
