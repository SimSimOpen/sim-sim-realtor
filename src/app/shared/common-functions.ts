import { Router } from '@angular/router';
import { Property } from './models/properties';

export function navigeteTo(url: string): void {
  const router = new Router();
  router.navigate([url]);
}

export const propertiesList: Property[] = [
  {
    id: 1,
    title: 'Modern Apartment in City Center',
    country: 'USA',
    region: 'California',
    city: 'Los Angeles',
    district: 'Downtown',
    type: 'Apartment',
    status: 'For Rent',
    views: 120,
    address: '123 Main St, Cityville',
    price: 1500,
    bedrooms: 2,
    bathrooms: 1,
    area: 850,
    imageUrl: 'assets/images/property1.jpg',
    dateListed: '2024-06-15',
  },
  {
    id: 2,
    title: 'Spacious Family House',
    country: 'USA',
    region: 'Texas',
    city: 'Austin',
    district: 'Suburbia',
    type: 'House',
    status: 'For Sale',
    views: 250,
    address: '456 Oak Dr, Suburbia',
    price: 350000,
    bedrooms: 4,
    bathrooms: 3,
    area: 2200,
    imageUrl: 'assets/images/property2.jpg',
    dateListed: '2024-05-20',
  },
  {
    id: 3,
    title: 'Cozy Condo Near Park',
    country: 'USA',
    region: 'New York',
    city: 'New York City',
    district: 'Manhattan',
    type: 'Condo',
    status: 'For Rent',
    views: 90,
    address: '789 Pine St, Greenfield',
    price: 1200,
    bedrooms: 1,
    bathrooms: 1,
    area: 600,
    imageUrl: 'assets/images/property3.jpg',
    dateListed: '2024-06-10',
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
