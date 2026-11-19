export const placeCategories = ['All', 'Gyms', 'Cafés', 'Parks', 'Salons', 'Shopping', 'Essentials'] as const;

export type PlaceCategory = (typeof placeCategories)[number];
export type DiscoverableCategory = Exclude<PlaceCategory, 'All'>;

export type Place = {
  id: string;
  name: string;
  category: DiscoverableCategory;
  neighborhood: string;
  city: string;
  tagline: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  rating: string;
  reviewCount: number;
  priceLabel: string;
  distanceLabel: string;
  highlights: string[];
  accent: string;
};
