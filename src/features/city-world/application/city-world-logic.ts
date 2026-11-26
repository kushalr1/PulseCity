import type { Place, PlaceMood } from '@/features/places/domain/place';
import { fullSceneSets, type FullSceneSet } from '../full-scene-assets';

const healthCategories = new Set(['Pharmacy', 'Hospitals', 'Clinics & Doctors', 'Diagnostic Labs', 'Pet Clinics']);

export function getFullSceneAssets(theme: 'city' | 'winter', mood: PlaceMood): FullSceneSet {
  const set = fullSceneSets[`full/${theme}/${mood}`];
  if (!set) throw new Error(`Missing full City World artwork for ${theme}/${mood}`);
  return set;
}

export type FullSceneSelection = { theme: 'city' | 'winter'; mood: PlaceMood };

export function resolveFullMoodTransition(from: FullSceneSelection, targetTheme: 'city' | 'winter', targetMood: PlaceMood) {
  const to = { theme: targetTheme, mood: targetMood };
  return {
    from,
    to,
    fromKey: `full/${from.theme}/${from.mood}`,
    toKey: `full/${to.theme}/${to.mood}`,
  };
}

export function getSurpriseCandidate(places: Place[], mood: PlaceMood, random = Math.random): Place | null {
  const eligible = places.filter((place) => place.kind === 'demo'
    && !healthCategories.has(place.category)
    && place.moods.includes(mood));
  if (!eligible.length) return null;
  const index = Math.min(eligible.length - 1, Math.max(0, Math.floor(random() * eligible.length)));
  return eligible[index];
}

export function moodTransition(from: PlaceMood, to: PlaceMood, reducedMotion: boolean) {
  return reducedMotion
    ? { from: to, to, durationMs: 0 }
    : { from, to, durationMs: 800 };
}

export function surpriseSearchDuration(repeatCount: number, reducedMotion: boolean) {
  if (reducedMotion) return 0;
  return repeatCount > 0 ? 700 : 1500;
}

export function districtPillPositions(
  districts: { id: string; name: string; x: number; top: number; matches: number }[],
  midWidth: number,
  focusedId: string | null,
) {
  const order = [...districts].sort((left, right) => Number(right.id === focusedId) - Number(left.id === focusedId)
    || right.matches - left.matches);
  const occupied: { x: number; y: number; width: number }[] = [];
  const positions: Record<string, number> = {};
  for (const district of order) {
    const center = district.x * midWidth;
    const width = Math.max(84, district.name.length * 7.5 + 44);
    const base = Math.max(844 * .34, Math.min(district.top - 42, 844 - 70));
    const candidates = [base, base - 42, base + 42, base - 84];
    const y = candidates.find((candidate) => !occupied.some((pill) => Math.abs(candidate - pill.y) < 42
      && Math.abs(center - pill.x) < (width + pill.width) / 2 + 6)) ?? candidates[candidates.length - 1];
    positions[district.id] = y;
    occupied.push({ x: center, y, width });
  }
  return positions;
}

export function districtForPlace(place: Place) {
  const area = `${place.neighborhood} ${place.city}`.toLowerCase();
  if (area.includes('sector 29') || area.includes('s29')) return 's29';
  if (area.includes('cyber')) return 'cyber';
  if (area.includes('galleria') || area.includes('dlf phase 4')) return 'galleria';
  if (area.includes('green') || area.includes('aravalli')) return 'green';
  return 'old';
}

export function districtPlaces(places: Place[], districtId: string, mood: PlaceMood) {
  return places.filter((place) => place.city === 'Gurugram'
    && districtForPlace(place) === districtId
    && place.moods.includes(mood)
    && !healthCategories.has(place.category));
}

