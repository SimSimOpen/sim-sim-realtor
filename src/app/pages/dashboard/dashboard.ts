import { Component } from '@angular/core';
import { Property } from '../../shared/models/properties';
import { Common } from '../../shared/common';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  constructor(public common: Common) {}

  recentProperties: Property[] = [
    {
      id: 1,
      title: 'Modern Apartment in City Center',
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
}
