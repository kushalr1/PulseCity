import { describe, expect, test } from '@jest/globals';
import { rankPlaces, selectSearchEvents } from '@/features/places/application/explore-search';
import type { Place } from '@/features/places/domain/place';
import type { HomeEvent } from '@/features/home/domain/home-events';

const place = (id: string, name: string, category: Place['category'] = 'Cafés'): Place => ({
  id, name, category, neighborhood: 'Sector 29', city: 'Gurugram', latitude: 28.45, longitude: 77.02,
  kind: 'demo', moods: [], illustration: 'cafe', tagline: '', description: '', highlights: [], accent: '#000',
});
const events: HomeEvent[] = [
  { id: 'event-1', title: 'Coffee Tasting', category: 'Workshop', venue: 'Kettle & Kulhad', daysFromNow: 1, time: '7:00 PM', description: '', illustration: 'workshop' },
  { id: 'event-2', title: 'Coffee Open Mic', category: 'Music', venue: 'Second Draft Coffee', daysFromNow: 2, time: '8:00 PM', description: '', illustration: 'music' },
  { id: 'event-3', title: 'Coffee Past Event', category: 'Music', venue: 'Old Café', daysFromNow: -1, time: '6:00 PM', description: '', illustration: 'music' },
  { id: 'event-4', title: 'Coffee and Clay', category: 'Workshop', venue: 'Clay Studio', daysFromNow: 3, time: '5:00 PM', description: '', illustration: 'workshop' },
];

describe('Explore search ranking', () => {
  test('ranks exact place names before prefix, then other place matches', () => {
    const ranked = rankPlaces('Kettle', [place('contains', 'The Kettle Shop'), place('exact', 'Kettle'), place('prefix', 'Kettle House')]);
    expect(ranked.map(({ id }) => id)).toEqual(['exact', 'prefix', 'contains']);
  });

  test('matches place name, category, and area fields without unrelated results', () => {
    expect(rankPlaces('pharmacy', [place('other', 'Daily Basket', 'Grocery'), place('pharmacy', 'Neighborhood Chemist', 'Pharmacy')]).map(({ id }) => id)).toEqual(['pharmacy']);
  });

  test('returns up to three matching upcoming events and excludes past events', () => {
    expect(selectSearchEvents('coffee', events).map(({ id }) => id)).toEqual(['event-1', 'event-2', 'event-4']);
  });

  test('returns no events until query matches and supports event-only matches', () => {
    expect(selectSearchEvents('', events)).toEqual([]);
    expect(selectSearchEvents('open mic', events).map(({ id }) => id)).toEqual(['event-2']);
  });
});
