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

export const amenitiesList: { key: keyof PropertyAmenities; label: string }[] = [
  { key: 'parking', label: 'Parking' },
  { key: 'garden', label: 'Garden' },
  { key: 'swimmingPool', label: 'Swimming Pool' },
  { key: 'gym', label: 'Gym' },
  { key: 'security', label: 'Security' },
  { key: 'elevator', label: 'Elevator' },
  { key: 'washingMachine', label: 'Washing Machine' },
  { key: 'airConditioning', label: 'Air Conditioning' },
  { key: 'internet', label: 'Wi-Fi' },
  { key: 'refrigerator', label: 'Refrigerator' },
  { key: 'dishwasher', label: 'Dishwasher' },
  { key: 'microwave', label: 'Microwave' },
  { key: 'parkingSpace', label: 'Parking Space' },
  { key: 'tv', label: 'TV' },
  { key: 'satellite', label: 'Satellite' },
  { key: 'furniture', label: 'Furniture' },
];
