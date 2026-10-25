import { ListingStatus, OccupancyStatus, OfferType } from '../enums/PropertyStatus';
import { CarBodyType, CarCondition, DriveType, FuelType, Transmission } from '../enums/CarStatus';
import { PropertyMedia } from './properties';

/** Shape of /api/product/v1/car responses. */
export interface Car {
  id: number;
  title: string | null;
  description: string | null;
  price: number | null;
  views: number;

  brand: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  engineVolume: number | null;
  color: string | null;
  customsCleared: boolean | null;

  bodyType: CarBodyType | null;
  fuelType: FuelType | null;
  transmission: Transmission | null;
  driveType: DriveType | null;
  condition: CarCondition | null;
  offerType: OfferType | null;
  listingStatus: ListingStatus;
  occupancyStatus: OccupancyStatus | null;

  ownerContact: string | null;
  agent: string;
  agentID: number;
  regionId: number | null;
  districtId: number | null;
  placeId: number | null;
  /** [region, district, place, address] in the UI language. */
  location: string[];
  latitude: number | null;
  longitude: number | null;
  medias: PropertyMedia[];
  createdAt: string;
  updatedAt: string | null;
}

/** Body of PUT /car/update/{id}; omitted fields stay as they are. */
export type CarRequest = Partial<
  Omit<Car, 'id' | 'views' | 'agent' | 'agentID' | 'location' | 'medias' | 'createdAt' | 'updatedAt'>
> & { address?: string | null };

export interface CarsStats {
  total_count: number;
  active_count: number;
  sold_count: number;
  draft_count: number;
}

export interface CarFilter {
  search: string;
  listingStatus: ListingStatus | null;
  bodyType: CarBodyType | null;
}

/** One entry of GET /car/brands: a catalog brand with its model names. */
export interface CarBrand {
  brand: string;
  models: string[];
}
