import { ListingStatus, OccupancyStatus, PropertyType } from '../enums/PropertyStatus';

export interface Property {
  id?: number;
  title: string;
  description: string;
  price: number;
  numberOfRooms: number;
  address: string;
  country?: string;
  region?: string;
  place?: string;
  district?: string;
  type?: PropertyType; // e.g., 'Apartment', 'House', etc.
  offerType?: string; // e.g., 'For Sale', 'For Rent', etc.
  views?: number;
  area?: number; // in square feet
  medias?: PropertyMedia[];
  listingStatus: ListingStatus;
  occupancyStatus?: OccupancyStatus; // e.g., 'Vacant', 'Occupied'
  amenities?: PropertyAmenities;
  dateListed?: string;
}

export interface PropertyLocation {
  country: string;
  region_id: number;
  district_id: number;
  place_id: number;
  address: string;
}

export interface PropertyAmenities {
  parking: boolean;
  garden: boolean;
  swimmingPool: boolean;
  gym: boolean;
  security: boolean;
  elevator?: boolean;
  washingMachine?: boolean;
  airConditioning?: boolean;
  internet?: boolean;
  refrigerator?: boolean;
  dishwasher?: boolean;
  microwave?: boolean;
  parkingSpace?: boolean;
  tv?: boolean;
  satellite?: boolean;
  furniture?: boolean;
}
export const defaultAmenities: PropertyAmenities = {
  parking: false,
  swimmingPool: false,
  gym: false,
  garden: false,
  security: false,
  elevator: false,
  washingMachine: false,
  airConditioning: false,
  internet: false,
  refrigerator: false,
  dishwasher: false,
  microwave: false,
  parkingSpace: false,
  tv: false,
  satellite: false,
  furniture: false,
};

export interface PropertyMedia {
  id: number;
  mediaUrl: string;
  type: string;
  isCoverImage: boolean;
}

export interface Region {
  id: number;
  name_en: string;
}

export interface District {
  id: number;
  name_en: string;
  region_id: number;
}

export interface Place {
  id: number;
  name_en: string;
  region_id: number;
  district_id: number;
}
