import { Router } from '@angular/router';
import { Property } from './models/properties';

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
    city: 'Los Angeles',
    district: 'Downtown',
    type: 'Apartment',
    status: 'For Sale',
    views: 120,
    area: 1200,
    medias: [],
    dateListed: '2024-06-01',
  },
];

export const amenitiesList: string[] = [
  'Swimming Pool',
  'Gym',
  'Wi-Fi',
  'Air Conditioning',
  'Parking',
  'Pet Friendly',
  'Garden',
  'Balcony',
  'Fireplace',
  'Laundry Room',
];
