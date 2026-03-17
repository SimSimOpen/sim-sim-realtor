import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { District, Place, Region } from '../models/properties';
import { PRODUCT_URL } from '../constants/urls';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  constructor(private http: HttpClient) {}

  getRegions(): Observable<Region[]> {
    return this.http.get<Region[]>(`${PRODUCT_URL}/v1/location/regions`);
  }
  getDistrictsByRegion(regionId: number): Observable<District[]> {
    return this.http.get<District[]>(`${PRODUCT_URL}/v1/location/districts/${regionId}`);
  }
  getPlacesByDistrict(districtId: number): Observable<Place[]> {
    return this.http.get<Place[]>(`${PRODUCT_URL}/v1/location/places/${districtId}`);
  }
}
