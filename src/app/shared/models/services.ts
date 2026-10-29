import { ListingStatus } from '../enums/PropertyStatus';
import { PriceMode, ServiceCategory, ServiceKind } from '../enums/Services';
import { PropertyMedia } from './properties';

/** Shape of /api/product/v1/services responses. */
export interface ServiceItem {
  id: number;
  title: string | null;
  description: string | null;
  /** The poster's rate when OFFERING, their budget when SEEKING. */
  price: number | null;
  priceMode: PriceMode | null;
  views: number;

  category: ServiceCategory | null;
  /** OFFERING supplies the service, SEEKING needs one. */
  kind: ServiceKind;
  listingStatus: ListingStatus;

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

/** Body of PUT /services/update/{id}; omitted fields stay as they are. */
export type ServiceRequest = Partial<
  Omit<
    ServiceItem,
    'id' | 'views' | 'agent' | 'agentID' | 'location' | 'medias' | 'createdAt' | 'updatedAt'
  >
> & { address?: string | null };

export interface ServiceStats {
  total_count: number;
  active_count: number;
  draft_count: number;
  offering_count: number;
  seeking_count: number;
}

export interface ServiceFilter {
  search: string;
  listingStatus: ListingStatus | null;
  kind: ServiceKind | null;
  category: ServiceCategory | null;
}
