import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PRODUCT_URL } from '../constants/urls';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}

  uploadImage(property_id: number, files: File[]): Observable<string> {
    const formData: FormData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const params = new HttpParams().append('property_id', property_id.toString());
    return this.http.post<string>(`${PRODUCT_URL}/v1/property/add/images`, formData, { params });
  }
}
