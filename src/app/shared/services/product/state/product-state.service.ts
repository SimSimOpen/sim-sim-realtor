import { inject, Injectable, signal } from '@angular/core';
import { ProductApiService } from './product-api.service';
import { Property } from '../../../models/properties';
import { Observable, switchMap, tap } from 'rxjs';
import { Page } from '../../../models/commont-models';

@Injectable({ providedIn: 'root' })
export class ProductStateService {
  private propertyApi = inject(ProductApiService);

  private _editingProperty = signal<Property | null>(null);
  private _properties = signal<Property[]>([]);

  editingProperty = this._editingProperty.asReadonly();
  properties = this._properties.asReadonly();

  startEditing(property: Property): void {
    this._editingProperty.set(property);
  }
  setProperties(properties: Property[]): void {
    this._properties.set(properties);
  }

  updateEditing(partial: Partial<Property>): void {
    this._editingProperty.update((current) => ({ ...current, ...partial }) as Property);
  }

  clearEditing(): void {
    this._editingProperty.set(null);
  }

  fetchProperties(page: number, size: number, sort?: string): void {
    this.propertyApi.getAllProperties(page, size, sort).subscribe({
      next: (properties) =>
        this._properties.set(
          properties.content.map((property) => {
            const place = (property as any)['location'][0];
            const district = (property as any)['location'][1];
            const region = (property as any)['location'][2];
            const publishedDate = (property as any)['updatedAt'];
            property.dateListed = publishedDate;
            return { ...property, place, district, region };
          }),
        ),
    });
  }

  saveAndRefresh(page: number, size: number, sort?: string): Observable<Page<Property>> {
    const property = this._editingProperty() as Property;
    return this.propertyApi.updateProperty(property).pipe(
      switchMap(() => this.propertyApi.getAllProperties(page, size, sort)),
      tap((properties) => {
        this._properties.set(properties.content);
        this._editingProperty.set(null);
      }),
    );
  }
}
