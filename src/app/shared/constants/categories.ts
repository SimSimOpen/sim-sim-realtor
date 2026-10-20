export type CategorySlug =
  | 'real-estate'
  | 'cars'
  | 'second-hand'
  | 'home-garden'
  | 'services'
  | 'electronics';

export interface MarketplaceCategory {
  slug: CategorySlug;
  title: string;
  tagline: string;
  description: string;
  /** Tailwind classes for the icon badge and accents on cards. */
  accent: string;
  /** Categories with an admin section can be entered; the rest show a "not active yet" panel. */
  available: boolean;
  /** Display order and number of live listings, filled in from the backend. */
  sortOrder?: number;
  listingCount?: number;
}

/** Shape returned by GET /api/product/v1/category/all. */
export interface MarketplaceCategoryDTO {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  available: boolean;
  sortOrder: number;
  listingCount: number;
}

/** Admin route of each category that already has a management screen. */
export const SECTION_ROUTES: Partial<Record<CategorySlug, string>> = {
  'real-estate': '/properties',
};

export const CATEGORIES: MarketplaceCategory[] = [
  {
    slug: 'real-estate',
    title: 'Real Estate',
    tagline: 'Homes, apartments & commercial',
    description: 'Rent or buy apartments, houses, land and commercial spaces from verified agents.',
    accent: 'bg-blue-50 text-blue-700',
    available: true,
  },
  {
    slug: 'cars',
    title: 'Cars',
    tagline: 'Cars, motorcycles & parts',
    description: 'Find new and used vehicles, spare parts and accessories from dealers and owners.',
    accent: 'bg-red-50 text-red-700',
    available: false,
  },
  {
    slug: 'second-hand',
    title: 'Second-hand',
    tagline: 'Pre-loved items at fair prices',
    description: 'Clothing, books, sports gear and everything else that deserves a second life.',
    accent: 'bg-amber-50 text-amber-700',
    available: false,
  },
  {
    slug: 'home-garden',
    title: 'Home & Garden',
    tagline: 'Furniture, decor & appliances',
    description: 'Furnish your space with furniture, home appliances, decor and garden supplies.',
    accent: 'bg-emerald-50 text-emerald-700',
    available: false,
  },
  {
    slug: 'services',
    title: 'Services',
    tagline: 'Repairs, cleaning, tutoring & more',
    description: 'Hire trusted local professionals for repairs, moving, cleaning, lessons and more.',
    accent: 'bg-violet-50 text-violet-700',
    available: false,
  },
  {
    slug: 'electronics',
    title: 'Electronics',
    tagline: 'Phones, computers & gadgets',
    description: 'Buy and sell phones, laptops, consoles, cameras and other gadgets.',
    accent: 'bg-cyan-50 text-cyan-700',
    available: false,
  },
];

export function findCategory(slug: string | null | undefined): MarketplaceCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
