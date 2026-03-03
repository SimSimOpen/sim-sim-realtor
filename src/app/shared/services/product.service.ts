import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PRODUCT_URL } from '../constants/urls';
import { Property } from '../models/properties';
import { Page } from '../models/commont-models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
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

  uploadImage(property_id: number, files: File[]): Observable<string> {
    const formData: FormData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const params = new HttpParams().append('property_id', property_id.toString());
    return this.http.post<string>(`${PRODUCT_URL}/v1/property/add/images`, formData, { params });
  }

  deleteImage(image_id: number): Observable<string> {
    return this.http.delete(`${PRODUCT_URL}/v1/property/delete/image/${image_id}`, {
      responseType: 'text',
    });
  }

  createDraft(): Observable<Property> {
    return this.http.post<Property>(`${PRODUCT_URL}/v1/property/create-draft`, {});
  }
}
