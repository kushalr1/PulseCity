import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-image', () => ({ Image: require('react-native').Image }));
jest.mock('@/features/home/application/scene-preloader', () => ({
  ...(jest.requireActual('@/features/home/application/scene-preloader') as Record<string, unknown>),
  preloadFullMoodSets: async () => true,
  preloadSceneSources: async () => true,
  getPredecodedSceneImage: () => null,
}));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn() },
  useIsFocused: () => true,
}));
jest.mock('expo-symbols', () => ({ SymbolView: () => {
  const { View: MockView } = require('react-native');
  return <MockView />;
} }));
jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: () => { const gesture: Record<string, unknown> = {}; for (const method of ['hitSlop', 'activeOffsetX', 'failOffsetY', 'onBegin', 'onChange', 'onEnd', 'onFinalize']) gesture[method] = () => gesture; return gesture; },
    Tap: () => ({ onEnd: () => ({}) }),
    Simultaneous: () => ({}),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => {
    const { View: MockView } = require('react-native');
    return <MockView>{children}</MockView>;
  },
}));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: require('react-native').View },
  View: require('react-native').View,
  Easing: { cubic: (value: number) => value, inOut: (value: number) => value, linear: (value: number) => value, out: (value: number) => value },
  cancelAnimation: () => undefined,
  runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
  useAnimatedStyle: (factory: () => object) => factory(),
  useAnimatedReaction: (prepare: () => unknown) => { prepare(); },
  useDerivedValue: (factory: () => unknown) => ({ value: factory() }),
  useFrameCallback: () => undefined,
  useReducedMotion: () => false,
  useSharedValue: (value: unknown) => ({ value }),
  withRepeat: (value: unknown) => value,
  withTiming: (value: unknown) => value,
}));

import CityWorldScreen from '@/features/city-world/presentation/city-world-screen';
import { AppBootstrapProvider } from '@/providers/app-bootstrap-provider';
import { CityWorldMoodProvider } from '@/providers/city-world-mood-provider';
import { PlacesProvider } from '@/providers/places-provider';

function renderCityWorld() {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, right: 0, bottom: 34, left: 0 } }}>
      <AppBootstrapProvider>
        <PlacesProvider>
          <CityWorldMoodProvider><CityWorldScreen /></CityWorldMoodProvider>
        </PlacesProvider>
      </AppBootstrapProvider>
    </SafeAreaProvider>,
  );
}

describe('approved City World layout', () => {
  test('shows approved header, intro, and district choices', async () => {
    await renderCityWorld();

    expect(screen.getByRole('button', { name: 'Close City World' })).toBeTruthy();
    expect(screen.getByText('Explore the city')).toBeTruthy();
    expect(screen.getByText('ILLUSTRATED CITY · NOT TO SCALE')).toBeTruthy();
    expect(screen.getByText('Pick a district.\nSee what’s\nhappening.')).toBeTruthy();
    expect(screen.getByText('Drag to look around')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Choose mood, Chill' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Select district Old Gurugram' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Select district Sector 29' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Select district Cyber City' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Surprise me' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Real map' })).toBeTruthy();
    expect(screen.queryByText('Demo city world · drag to look around')).toBeNull();
  });

  test('opens six mood choices with the approved descriptions', async () => {
    await renderCityWorld();
    await fireEvent.press(screen.getByRole('button', { name: 'Choose mood, Chill' }));

    for (const description of [
      'Slow down, Gurgaon.',
      'Round up the group chat.',
      'Touch grass, Gurgaon edition.',
      'Laptop off. Legs on.',
      'Follow your appetite.',
      'Go beyond CyberHub.',
    ]) {
      expect(screen.getByText(description)).toBeTruthy();
    }
    expect(screen.getAllByRole('radio')).toHaveLength(6);
  });

  test('selects mood from sheet and keeps it selected in shared state', async () => {
    await renderCityWorld();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Choose mood, Chill' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Choose mood, Chill' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Social. Round up the group chat.' }));

    expect(screen.getByRole('button', { name: 'Choose mood, Social' })).toBeTruthy();
    expect(screen.getByTestId('full-scene-city-social')).toBeTruthy();
  });
});
