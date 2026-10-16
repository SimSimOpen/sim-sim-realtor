import { Router } from '@angular/router';
import { Property, PropertyAmenities } from './models/properties';
import { ListingStatus, PropertyType } from './enums/PropertyStatus';

export function navigeteTo(url: string): void {
  const router = new Router();
  router.navigate([url]);
}

export const propertiesList: Property[] = [
  {
    id: 1,
    title: 'Modern Apartment in Downtown',
    description:
      'A spacious and modern apartment located in the heart of the city, close to all amenities.',
    price: 350000,
    numberOfRooms: 3,
    address: '123 Main Street',
    country: 'USA',
    region: 'California',
    place: 'Los Angeles',
    district: 'Downtown',
    type: PropertyType.APARTMENT,
    offerType: 'For Sale',
    views: 120,
    area: 1200,
    medias: [],
    dateListed: '2024-06-01',
    listingStatus: ListingStatus.DRAFT,
    ownerContact: 'owner@example.com',
    agent: 'Sarah Jenkins',
    agentId: 1,
  },
];

/** `label` is a translation key. */
export const amenitiesList: { key: keyof PropertyAmenities; label: string }[] = [
  { key: 'parking', label: 'amenity.parking' },
  { key: 'garden', label: 'amenity.garden' },
  { key: 'swimmingPool', label: 'amenity.swimmingPool' },
  { key: 'gym', label: 'amenity.gym' },
  { key: 'security', label: 'amenity.security' },
  { key: 'elevator', label: 'amenity.elevator' },
  { key: 'washingMachine', label: 'amenity.washingMachine' },
  { key: 'airConditioning', label: 'amenity.airConditioning' },
  { key: 'internet', label: 'amenity.internet' },
  { key: 'refrigerator', label: 'amenity.refrigerator' },
  { key: 'dishwasher', label: 'amenity.dishwasher' },
  { key: 'microwave', label: 'amenity.microwave' },
  { key: 'parkingSpace', label: 'amenity.parkingSpace' },
  { key: 'tv', label: 'amenity.tv' },
  { key: 'satellite', label: 'amenity.satellite' },
  { key: 'furniture', label: 'amenity.furniture' },
];
