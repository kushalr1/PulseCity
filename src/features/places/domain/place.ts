export const placeCategories = ['All', 'Pharmacy', 'Grocery', 'Cafés', 'Salons', 'Markets', 'Mobile repair', 'Gyms', 'Parks', 'Restaurants', 'Malls', 'Things to do', 'Hospitals', 'Clinics & Doctors', 'Diagnostic Labs', 'Pet Clinics'] as const;

export type PlaceCategory = (typeof placeCategories)[number];
export type DiscoverableCategory = Exclude<PlaceCategory, 'All'>;
export type PlaceMood = 'chill' | 'social' | 'nature' | 'active' | 'foodie' | 'explore';
export type PlaceKind = 'landmark' | 'demo';

export type Place = {
  id: string;
  name: string;
  category: DiscoverableCategory;
  neighborhood: string;
  city: string;
  latitude: number;
  longitude: number;
  kind: PlaceKind;
  moods: PlaceMood[];
  moodRank?: Partial<Record<PlaceMood, number>>;
  illustration: string;
  tagline: string;
  description: string;
  highlights: string[];
  accent: string;
};
