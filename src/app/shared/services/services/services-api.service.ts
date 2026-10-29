import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PRODUCT_URL } from '../../constants/urls';
import { Page } from '../../models/commont-models';
import { ServiceFilter, ServiceItem, ServiceRequest, ServiceStats } from '../../models/services';

const SERVICES_URL = `${PRODUCT_URL}/v1/services`;

@Injectable({ providedIn: 'root' })
export class ServicesApiService {
  private http = inject(HttpClient);

  createDraft(): Observable<ServiceItem> {
    return this.http.post<ServiceItem>(`${SERVICES_URL}/create-draft`, {});
  }

  update(id: number, item: ServiceRequest): Observable<ServiceItem> {
    return this.http.put<ServiceItem>(`${SERVICES_URL}/update/${id}`, item);
  }

  getById(id: number): Observable<ServiceItem> {
    return this.http.get<ServiceItem>(`${SERVICES_URL}/${id}`);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${SERVICES_URL}/${id}`, { responseType: 'text' });
  }

  getMediaCount(id: number): Observable<number> {
    return this.http.get<number>(`${SERVICES_URL}/media-count/${id}`);
  }

  getStats(): Observable<ServiceStats> {
    return this.http.get<ServiceStats>(`${SERVICES_URL}/stats`);
  }

  /** The agent's own listings (all listings for an admin); filtered when any criterion is set. */
  list(
    filter: ServiceFilter,
    page: number,
    size: number,
    sort?: string,
  ): Observable<Page<ServiceItem>> {
    let params = new HttpParams().append('page', page).append('size', size);
    if (sort) params = params.append('sort', sort);
    const filtered = filter.search || filter.listingStatus || filter.kind || filter.category;
    if (!filtered) {
      return this.http.get<Page<ServiceItem>>(`${SERVICES_URL}/agents-all`, { params });
    }
    if (filter.search) params = params.append('search', filter.search);
    if (filter.listingStatus) params = params.append('listingStatus', filter.listingStatus);
    if (filter.kind) params = params.append('kind', filter.kind);
    if (filter.category) params = params.append('categories', filter.category);
    // Same scoping as agents-all above: the backend only narrows the list to the caller when the
    // request says it is the panel's own list, so the client browse stays public.
    params = params.append('mine', 'true');
    return this.http.get<Page<ServiceItem>>(`${SERVICES_URL}/filter`, { params });
  }
}
