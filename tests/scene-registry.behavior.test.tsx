import { describe, expect, test } from '@jest/globals';

import { resolveSceneSelection } from '@/features/home/scene-registry';
import { getHomePreviewDistricts } from '@/features/home/application/home-place-selection';
import type { Place } from '@/features/places/domain/place';

describe('Home scene registry', () => {
  test('selects v1.2 City World artwork for the Chill hero and preview', () => {
    expect(resolveSceneSelection('hero', 'chill', 'city')).toEqual({ surface: 'hero', mood: 'chill', theme: 'city' });
    expect(resolveSceneSelection('preview', 'chill', 'city')).toEqual({ surface: 'preview', mood: 'chill', theme: 'city' });
  });

  test('selects exported Winter artwork without changing the scene contract', () => {
    expect(resolveSceneSelection('hero', 'chill', 'winter')).toEqual({ surface: 'hero', mood: 'chill', theme: 'winter' });
    expect(resolveSceneSelection('preview', 'chill', 'winter')).toEqual({ surface: 'preview', mood: 'chill', theme: 'winter' });
  });

  test('keeps shared mood selection on Home even when preview art uses v1.2 base scene', () => {
    for (const mood of ['chill', 'social', 'nature', 'active', 'foodie', 'explore'] as const) {
      expect(resolveSceneSelection('hero', mood, 'city')).toEqual({ surface: 'hero', mood, theme: 'city' });
      expect(resolveSceneSelection('preview', mood, 'city')).toEqual({ surface: 'preview', mood, theme: 'city' });
    }
  });

  test('shows only mood-matched Gurugram districts in Home preview', () => {
    const fixture = (id: string, category: Place['category'], neighborhood: string, city: string, moods: Place['moods']): Place => ({
      id, category, neighborhood, city, moods, name: id, latitude: 0, longitude: 0, kind: 'demo', illustration: 'cafe', tagline: '', description: '', highlights: [], accent: '#000',
    });
    const places = [
      fixture('s29', 'Cafés', 'Sector 29', 'Gurugram', ['social']),
      fixture('cyber', 'Restaurants', 'Cyber City', 'Gurugram', ['chill']),
      fixture('galleria', 'Markets', 'Galleria Market', 'Gurugram', ['social']),
      fixture('clinic', 'Clinics & Doctors', 'Sector 29', 'Gurugram', ['social']),
      fixture('other-city', 'Cafés', 'Indiranagar', 'Bengaluru', ['social']),
    ];

    expect(getHomePreviewDistricts(places, 'social').map(({ label }) => label)).toEqual(['Sector 29', 'Galleria']);
  });

  test('selects a full-screen set for every mood and theme', () => {
    for (const mood of ['chill', 'social', 'nature', 'active', 'foodie', 'explore'] as const) {
      for (const theme of ['city', 'winter'] as const) {
        expect(resolveSceneSelection('full', mood, theme)).toEqual({ surface: 'full', mood, theme });
      }
    }
  });
});
