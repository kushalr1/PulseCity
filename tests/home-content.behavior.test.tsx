import { describe, expect, test } from '@jest/globals';

import { mockPlaces } from '@/data/mock-place-repository';
import { getNearbyPlaces, getTonightPicks, sortCollectionsByMood } from '@/features/home/application/home-place-selection';
import { getUpcomingHomeEvents, homeEvents } from '@/features/home/domain/home-events';
import { homeCollections } from '@/features/home/domain/home-collections';

describe('Home discovery content', () => {
  test('uses Gurugram-only records without invented ratings or photos', () => {
    expect(mockPlaces.length).toBeGreaterThan(0);
    expect(mockPlaces.every((place) => place.city === 'Gurugram')).toBe(true);
    expect(mockPlaces.every((place) => !('rating' in place) && !('imageUrl' in place))).toBe(true);
  });

  test('limits Tonight picks to matching mood places, nearest first', () => {
    const origin = { latitude: 28.4595, longitude: 77.0266 };
    const picks = getTonightPicks(mockPlaces, 'chill', origin, 3);

    expect(picks).toHaveLength(3);
    expect(picks.every((place) => place.moods.includes('chill'))).toBe(true);
    expect(picks[0]?.id).toBe('kettle');
  });

  test('limits Nearby to nearest places around selected area', () => {
    const nearby = getNearbyPlaces(mockPlaces, { latitude: 28.4595, longitude: 77.0266 }, 4);

    expect(nearby).toHaveLength(4);
    expect(nearby.map(({ place }) => place.id)).toEqual(['leisure-valley', 's29-market', 'kettle', 'kavach']);
  });

  test('excludes past Home events and orders upcoming events by start offset', () => {
    const upcoming = getUpcomingHomeEvents([
      ...homeEvents,
      { ...homeEvents[0]!, id: 'past', daysFromNow: -1 },
    ]);

    expect(upcoming.some((event) => event.id === 'past')).toBe(false);
    expect(upcoming[0]?.daysFromNow).toBe(0);
  });

  test('moves collections matching selected mood to the front', () => {
    expect(sortCollectionsByMood(homeCollections, 'nature')[0]?.id).toBe('touch-grass');
    expect(sortCollectionsByMood(homeCollections, 'chill')[0]?.id).toBe('coffee-conv');
  });

  test('runs Home sorting on JavaScript runtimes without Array.toSorted', () => {
    const original = Object.getOwnPropertyDescriptor(Array.prototype, 'toSorted');
    Object.defineProperty(Array.prototype, 'toSorted', { configurable: true, value: undefined });
    try {
      expect(getNearbyPlaces(mockPlaces, { latitude: 28.4595, longitude: 77.0266 }, 1)[0]?.place.id).toBe('leisure-valley');
      expect(getTonightPicks(mockPlaces, 'chill', { latitude: 28.4595, longitude: 77.0266 }, 1)[0]?.id).toBe('kettle');
      expect(sortCollectionsByMood(homeCollections, 'nature')[0]?.id).toBe('touch-grass');
      expect(getUpcomingHomeEvents(homeEvents, 1)[0]?.id).toBe('clay-night');
    } finally {
      if (original) Object.defineProperty(Array.prototype, 'toSorted', original);
      else delete (Array.prototype as { toSorted?: unknown }).toSorted;
    }
  });
});
