import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  Easing: { inOut: (value: number) => value },
  cancelAnimation: () => undefined,
  useSharedValue: (value: unknown) => ({ value }),
  useReducedMotion: () => false,
  withTiming: (value: unknown) => value,
}));

import { mockPlaces } from '@/data/mock-place-repository';
import { districtPillPositions, getFullSceneAssets, getSurpriseCandidate, moodTransition, resolveFullMoodTransition, surpriseSearchDuration, type FullSceneSelection } from '@/features/city-world/application/city-world-logic';
import { CityWorldMoodProvider, useCityWorldMood } from '@/providers/city-world-mood-provider';
import { fullMoodSetSources } from '@/features/home/application/scene-preloader';

describe('City World behavior', () => {
  test('registers all six moods in both full-screen themes', () => {
    for (const theme of ['city', 'winter'] as const) {
      for (const mood of ['chill', 'social', 'nature', 'active', 'foodie', 'explore'] as const) {
        const set = getFullSceneAssets(theme, mood);
        expect(set.assets.length).toBeGreaterThan(0);
        expect(set.glowBoost).toBeGreaterThan(0);
        expect(set.assets.some((asset) => asset.name === 'surprise_cone')).toBe(theme === 'city');
        if (theme === 'winter') expect(set.scene.snowmen).toHaveLength(5);
      }
    }
  });

  test('full-scene preload includes every mood set and both window-light maps for its theme', () => {
    const sources = fullMoodSetSources('city');
    expect(sources.length).toBeGreaterThan(40);
  });

  test('Surprise Me never selects a health category or a real landmark', () => {
    for (const sample of [0, .25, .5, .75, .99]) {
      const chosen = getSurpriseCandidate(mockPlaces, 'chill', () => sample);
      expect(chosen).not.toBeNull();
      expect(chosen?.kind).toBe('demo');
      expect(['Pharmacy', 'Hospitals', 'Clinics & Doctors', 'Diagnostic Labs', 'Pet Clinics']).not.toContain(chosen?.category);
    }
  });

  test('mood changes cross-fade over 800ms and reduced motion swaps immediately', () => {
    expect(moodTransition('chill', 'nature', false)).toEqual({ from: 'chill', to: 'nature', durationMs: 800 });
    expect(moodTransition('chill', 'nature', true)).toEqual({ from: 'nature', to: 'nature', durationMs: 0 });
    expect(surpriseSearchDuration(0, false)).toBe(1500);
    expect(surpriseSearchDuration(1, false)).toBe(700);
    expect(surpriseSearchDuration(0, true)).toBe(0);
  });

  test('City World transition target follows the last explicitly selected mood', () => {
    let current: FullSceneSelection = { theme: 'city', mood: 'chill' };
    let targetKey = getFullSceneAssets(current.theme, current.mood).key;
    for (const selectedMood of ['social', 'nature', 'active', 'foodie', 'chill'] as const) {
      const transition = resolveFullMoodTransition(current, current.theme, selectedMood);
      current = transition.to;
      targetKey = getFullSceneAssets(transition.to.theme, transition.to.mood).key;
    }
    expect(targetKey).toBe('full/city/chill');
  });

  test('places all district pills inside the scene without overlapping', () => {
    const districts = [
      { id: 'old', name: 'Old Gurugram', x: .1, top: 560, matches: 1 },
      { id: 's29', name: 'Sector 29', x: .29, top: 495, matches: 2 },
      { id: 'cyber', name: 'Cyber City', x: .5, top: 354, matches: 2 },
      { id: 'galleria', name: 'Galleria', x: .7, top: 589, matches: 2 },
      { id: 'green', name: 'Green Edge', x: .9, top: 591, matches: 1 },
    ];
    const positions = districtPillPositions(districts, 882, 'cyber');
    expect(Object.keys(positions)).toHaveLength(5);
    expect(Object.values(positions).every((top) => top >= 844 * .34 && top <= 844 - 70)).toBe(true);
  });

  test('Home and City World consumers read the same selected mood', async () => {
    function Consumer({ label, canChange = false }: { label: string; canChange?: boolean }) {
      const { mood, setMood } = useCityWorldMood();
      return <><Text>{`${label}:${mood}`}</Text>{canChange ? <Pressable onPress={() => setMood('nature')}><Text>Change mood</Text></Pressable> : null}</>;
    }
    const view = await render(<CityWorldMoodProvider><Consumer label="home" canChange /><Consumer label="city-world" /></CityWorldMoodProvider>);
    await fireEvent.press(view.getByText('Change mood'));
    expect(view.getByText('home:nature')).toBeTruthy();
    expect(view.getByText('city-world:nature')).toBeTruthy();
  });
});
