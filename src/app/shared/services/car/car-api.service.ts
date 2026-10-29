import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PRODUCT_URL } from '../../constants/urls';
import { Page } from '../../models/commont-models';
import { Car, CarBrand, CarFilter, CarRequest, CarsStats } from '../../models/cars';

const CAR_URL = `${PRODUCT_URL}/v1/car`;

@Injectable({ providedIn: 'root' })
export class CarApiService {
  private http = inject(HttpClient);

  createDraft(): Observable<Car> {
    return this.http.post<Car>(`${CAR_URL}/create-draft`, {});
  }

  update(id: number, car: CarRequest): Observable<Car> {
    return this.http.put<Car>(`${CAR_URL}/update/${id}`, car);
  }

  getById(id: number): Observable<Car> {
    return this.http.get<Car>(`${CAR_URL}/${id}`);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${CAR_URL}/${id}`, { responseType: 'text' });
  }

  getMediaCount(id: number): Observable<number> {
    return this.http.get<number>(`${CAR_URL}/car-media-count/${id}`);
  }

  getStats(): Observable<CarsStats> {
    return this.http.get<CarsStats>(`${CAR_URL}/stats`);
  }

  /** Brand/model catalog for the add-car form dropdowns. */
  getBrands(): Observable<CarBrand[]> {
    return this.http.get<CarBrand[]>(`${CAR_URL}/brands`);
  }

  /** The agent's own cars (all cars for an admin); filtered when any criterion is set. */
  list(filter: CarFilter, page: number, size: number, sort?: string): Observable<Page<Car>> {
    let params = new HttpParams().append('page', page).append('size', size);
    if (sort) params = params.append('sort', sort);
    const filtered = filter.search || filter.listingStatus || filter.bodyType;
    if (!filtered) {
      return this.http.get<Page<Car>>(`${CAR_URL}/agents-all`, { params });
    }
    if (filter.search) params = params.append('search', filter.search);
    if (filter.listingStatus) params = params.append('listingStatus', filter.listingStatus);
    if (filter.bodyType) params = params.append('bodyTypes', filter.bodyType);
    // Same scoping as agents-all above: the backend only narrows the list to the caller when the
    // request says it is the panel's own list, so the client browse stays public.
    params = params.append('mine', 'true');
    return this.http.get<Page<Car>>(`${CAR_URL}/filter`, { params });
  }
}
