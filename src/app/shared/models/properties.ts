export interface Property {
  id?: number;
  title: string;
  type: string; // e.g., 'Apartment', 'House', etc.
  status: string; // e.g., 'For Sale', 'For Rent', etc.
  views: number;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number; // in square feet
  imageUrl: string;
  dateListed: string;
}
