import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PRODUCT_URL } from '../../constants/urls';
import { Page } from '../../models/commont-models';
import {
  SecondHandFilter,
  SecondHandItem,
  SecondHandRequest,
  SecondHandStats,
} from '../../models/second-hand';

const SECOND_HAND_URL = `${PRODUCT_URL}/v1/second-hand`;

@Injectable({ providedIn: 'root' })
export class SecondHandApiService {
  private http = inject(HttpClient);

  createDraft(): Observable<SecondHandItem> {
    return this.http.post<SecondHandItem>(`${SECOND_HAND_URL}/create-draft`, {});
  }

  update(id: number, item: SecondHandRequest): Observable<SecondHandItem> {
    return this.http.put<SecondHandItem>(`${SECOND_HAND_URL}/update/${id}`, item);
  }

  getById(id: number): Observable<SecondHandItem> {
    return this.http.get<SecondHandItem>(`${SECOND_HAND_URL}/${id}`);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${SECOND_HAND_URL}/${id}`, { responseType: 'text' });
  }

  getMediaCount(id: number): Observable<number> {
    return this.http.get<number>(`${SECOND_HAND_URL}/media-count/${id}`);
  }

  getStats(): Observable<SecondHandStats> {
    return this.http.get<SecondHandStats>(`${SECOND_HAND_URL}/stats`);
  }

  /** The agent's own items (all items for an admin); filtered when any criterion is set. */
  list(
    filter: SecondHandFilter,
    page: number,
    size: number,
    sort?: string,
  ): Observable<Page<SecondHandItem>> {
    let params = new HttpParams().append('page', page).append('size', size);
    if (sort) params = params.append('sort', sort);
    const filtered = filter.search || filter.listingStatus || filter.subCategory;
    if (!filtered) {
      return this.http.get<Page<SecondHandItem>>(`${SECOND_HAND_URL}/agents-all`, { params });
    }
    if (filter.search) params = params.append('search', filter.search);
    if (filter.listingStatus) params = params.append('listingStatus', filter.listingStatus);
    if (filter.subCategory) params = params.append('subCategories', filter.subCategory);
    // Same scoping as agents-all above: the backend only narrows the list to the caller when the
    // request says it is the panel's own list, so the client browse stays public.
    params = params.append('mine', 'true');
    return this.http.get<Page<SecondHandItem>>(`${SECOND_HAND_URL}/filter`, { params });
  }
}
