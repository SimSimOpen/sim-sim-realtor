import { ListingStatus, OccupancyStatus, OfferType } from '../enums/PropertyStatus';
import { ItemCondition, SecondHandCategory } from '../enums/SecondHand';
import { PropertyMedia } from './properties';

/** Shape of /api/product/v1/second-hand responses. */
export interface SecondHandItem {
  id: number;
  title: string | null;
  description: string | null;
  price: number | null;
  views: number;

  subCategory: SecondHandCategory | null;
  condition: ItemCondition | null;
  /** Kept for items created before the field was dropped from the form; new items send null. */
  offerType: OfferType | null;
  listingStatus: ListingStatus;
  /** AVAILABLE or SOLD; null on older rows and treated as available. */
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

/** Body of PUT /second-hand/update/{id}; omitted fields stay as they are. */
export type SecondHandRequest = Partial<
  Omit<
    SecondHandItem,
    'id' | 'views' | 'agent' | 'agentID' | 'location' | 'medias' | 'createdAt' | 'updatedAt'
  >
> & { address?: string | null };

export interface SecondHandStats {
  total_count: number;
  active_count: number;
  sold_count: number;
  draft_count: number;
}

export interface SecondHandFilter {
  search: string;
  listingStatus: ListingStatus | null;
  subCategory: SecondHandCategory | null;
}
