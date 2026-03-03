export interface Property {
  id?: number;
  title: string;
  description: string;
  price: number;
  numberOfRooms: number;
  address: string;
  country?: string;
  region?: string;
  city?: string;
  district?: string;
  type?: string; // e.g., 'Apartment', 'House', etc.
  status?: string; // e.g., 'For Sale', 'For Rent', etc.
  views?: number;
  area?: number; // in square feet
  medias?: PropertyMedia[];
  dateListed?: string;
}

export interface PropertyMedia {
  id: number;
  mediaUrl: string;
  type: string;
  isCoverImage: boolean;
}
