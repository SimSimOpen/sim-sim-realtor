import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PRODUCT_URL } from '../../../constants/urls';
import { PropertiesStats, Property, PropertyFilter } from '../../../models/properties';
import { Page } from '../../../models/commont-models';

@Injectable({
  providedIn: 'root',
})
export class ProductApiService {
  constructor(private http: HttpClient) {}

  uploadProperty(property: Property): Observable<String> {
    return this.http.post(`${PRODUCT_URL}/v1/property/add`, property, {
      responseType: 'text',
    });
  }

  updateProperty(property: Property): Observable<Property> {
    return this.http.put<Property>(
      `${PRODUCT_URL}/v1/property/update-draft/${property.id}`,
      property,
    );
  }
  getAgentsProperties(page: number, size: number, sort?: string): Observable<Page<Property>> {
    let params = new HttpParams().append('page', page.toString()).append('size', size.toString());
    if (sort) {
      params = params.append('sort', sort);
    }
    return this.http.get<Page<Property>>(`${PRODUCT_URL}/v1/property/agents-all`, { params });
  }

  getAllProperties(page: number, size: number, sort?: string): Observable<Page<Property>> {
    let params = new HttpParams().append('page', page.toString()).append('size', size.toString());
    if (sort) {
      params = params.append('sort', sort);
    }
    return this.http.get<Page<Property>>(`${PRODUCT_URL}/v1/property/all`, { params });
  }

  getPropertyById(id: number): Observable<Property> {
    return this.http.get<Property>(`${PRODUCT_URL}/v1/property/${id}`);
  }
  getPropertiesStats(): Observable<PropertiesStats> {
    return this.http.get<PropertiesStats>(`${PRODUCT_URL}/v1/property/stats`);
  }

  getMediaCount(property_id: number): Observable<number> {
    return this.http.get<number>(`${PRODUCT_URL}/v1/property/property-media-count/${property_id}`);
  }

  deleteImage(image_id: number): Observable<string> {
    return this.http.delete(`${PRODUCT_URL}/v1/property/delete/image/${image_id}`, {
      responseType: 'text',
    });
  }

  createDraft(): Observable<Property> {
    return this.http.post<Property>(`${PRODUCT_URL}/v1/property/create-draft`, {});
  }
  deleteProduct(property_id: number) {
    return this.http.delete(`${PRODUCT_URL}/v1/property/${property_id}`, {
      responseType: 'text',
    });
  }

  filterProperties(
    filter: PropertyFilter,
    page: number,
    size: number,
    sort?: string,
  ): Observable<Page<Property>> {
    let params = new HttpParams().append('page', page.toString()).append('size', size.toString());
    if (filter.search) {
      params = params.append('search', filter.search);
    }
    if (filter.listingStatus) {
      params = params.append('listingStatus', filter.listingStatus);
    }
    if (filter.type) {
      params = params.append('type', filter.type);
    }
    if (sort) {
      params = params.append('sort', sort);
    }
    return this.http.get<Page<Property>>(`${PRODUCT_URL}/v1/property/filter`, { params });
  }
}
