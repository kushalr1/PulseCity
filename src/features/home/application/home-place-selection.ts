import type { Place, PlaceMood } from '@/features/places/domain/place';

export type Coordinates = { latitude: number; longitude: number };

export function distanceKm(from: Coordinates, to: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearbyPlaces(places: Place[], origin: Coordinates, limit = 4) {
  return places
    .map((place) => ({ place, distanceKm: distanceKm(origin, place) }))
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, limit);
}

export function getTonightPicks(places: Place[], mood: PlaceMood, origin: Coordinates, limit = 3) {
  return places
    .filter((place) => place.moods.includes(mood))
    .sort((left, right) => {
      const rankDifference = (right.moodRank?.[mood] ?? 0) - (left.moodRank?.[mood] ?? 0);
      return rankDifference || distanceKm(origin, left) - distanceKm(origin, right);
    })
    .slice(0, limit);
}

const excludedPreviewCategories = new Set(['Pharmacy', 'Hospitals', 'Clinics & Doctors', 'Diagnostic Labs', 'Pet Clinics']);

export function getHomePreviewDistricts(places: Place[], mood: PlaceMood) {
  const matches = places.filter((place) => place.city === 'Gurugram'
    && place.moods.includes(mood)
    && !excludedPreviewCategories.has(place.category));
  const districts = [
    { id: 's29', label: 'Sector 29', matches: (place: Place) => /sector\s*29|s29/i.test(place.neighborhood) },
    { id: 'cyber', label: 'Cyber City', matches: (place: Place) => /cyber/i.test(place.neighborhood) },
    { id: 'galleria', label: 'Galleria', matches: (place: Place) => /galleria|dlf phase 4/i.test(place.neighborhood) },
  ];
  return districts
    .map(({ id, label, matches: isMatch }) => ({ id, label, count: matches.filter(isMatch).length }))
    .filter((district) => district.count > 0);
}

export function sortCollectionsByMood<T extends { mood: PlaceMood }>(collections: T[], mood: PlaceMood) {
  return [...collections].sort((left, right) => Number(right.mood === mood) - Number(left.mood === mood));
}
