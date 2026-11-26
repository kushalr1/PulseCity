import { useState } from 'react';
import { describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View: NativeView, ScrollView } = require('react-native');
  return {
    __esModule: true,
    default: { View: NativeView, ScrollView },
    View: NativeView,
    runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
    useAnimatedReaction: (prepare: () => unknown, react: (next: unknown, previous: unknown) => void) => React.useEffect(() => react(prepare(), undefined), []),
    useAnimatedScrollHandler: (handlers: unknown) => handlers,
    cancelAnimation: () => undefined,
    Easing: { linear: (value: number) => value },
    useAnimatedStyle: (factory: () => object) => factory(),
    useDerivedValue: (factory: () => unknown) => ({ value: factory() }),
    useReducedMotion: () => false,
    useSharedValue: (value: unknown) => ({ value }),
    withRepeat: (animation: unknown) => animation,
    withTiming: (value: unknown) => value,
  };
});
jest.mock('expo-router', () => ({ useIsFocused: () => true, useLocalSearchParams: () => ({}) }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/features/weather/weather-chip', () => ({ WeatherChip: () => null }));

import HomeScreen from '@/features/home/presentation/home-screen';
import ExploreScreen from '@/features/places/presentation/explore-screen';
import PlaceDetailsScreen from '@/features/places/presentation/place-details-screen';
import SavedScreen from '@/features/places/presentation/saved-screen';
import { PlacesProvider } from '@/providers/places-provider';
import { AppBootstrapProvider } from '@/providers/app-bootstrap-provider';

type FlowRoute = { screen: 'home' | 'explore' | 'saved' } | { screen: 'details'; id: string };

// Test-only screen switcher exercises shared provider state, not Expo Router navigation.
function PlacesFlowHarness({ startAt = 'home' }: { startAt?: 'home' | 'explore' }) {
  const [history, setHistory] = useState<FlowRoute[]>([{ screen: startAt }]);
  const route = history[history.length - 1];
  const push = (next: FlowRoute) => setHistory((current) => [...current, next]);
  const back = () => setHistory((current) => current.length > 1 ? current.slice(0, -1) : current);
  const onPlacePress = (id: string) => push({ screen: 'details', id });

  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, right: 0, bottom: 34, left: 0 } }}>
      <AppBootstrapProvider>
        <PlacesProvider>
          <View>
            {route.screen === 'home' ? <HomeScreen onSavedPress={() => push({ screen: 'saved' })} onExplorePress={() => push({ screen: 'explore' })} onPlacePress={onPlacePress} /> : null}
            {route.screen === 'explore' ? <ExploreScreen onPlacePress={onPlacePress} /> : null}
            {route.screen === 'saved' ? <SavedScreen onPlacePress={onPlacePress} onExplorePress={() => push({ screen: 'explore' })} /> : null}
            {route.screen === 'details' ? <PlaceDetailsScreen id={route.id} onBack={back} onHome={() => setHistory([{ screen: 'home' }])} /> : null}
          </View>
        </PlacesProvider>
      </AppBootstrapProvider>
    </SafeAreaProvider>
  );
}

describe('Shared saved-place behavior across feature screens', () => {
  test('Home save appears in Saved and Details unsave removes it from Saved', async () => {
    await AsyncStorage.clear();
    await render(<PlacesFlowHarness />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Save Kettle & Kulhad' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove Kettle & Kulhad' })).toBeTruthy());
    const persisted = await AsyncStorage.getItem('pulsecity:app-bootstrap:v1');
    expect(JSON.parse(persisted ?? '{}').savedPlaces[0]).toMatchObject({
      id: 'kettle',
      cached: { name: 'Kettle & Kulhad', category: 'Cafés', area: 'Sector 29' },
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Saved places' }));
    await screen.findByText('Kettle & Kulhad');
    await fireEvent.press(screen.getByText('Kettle & Kulhad'));
    await screen.findByText('Saved to your places');

    await fireEvent.press(screen.getByText('Saved to your places'));
    expect(screen.getByText('Save this place')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    await waitFor(() => expect(screen.queryByText('Kettle & Kulhad')).toBeNull());
  });

  test('Explore save state remains shared with Details and returns after back', async () => {
    await AsyncStorage.clear();
    await render(<PlacesFlowHarness startAt="explore" />);

    const saveButtons = await screen.findAllByRole('button', { name: 'Save place' });
    await fireEvent.press(saveButtons[0]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove from saved places' })).toBeTruthy());
    await fireEvent.press(screen.getByText('Leisure Valley Park'));
    await screen.findByText('Saved to your places');

    await fireEvent.press(screen.getByRole('button', { name: 'Remove from saved places' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    await waitFor(() => expect(screen.queryAllByRole('button', { name: 'Remove from saved places' })).toHaveLength(0));
    expect(screen.getByLabelText('Search Gurugram places and services')).toBeTruthy();
  });
});
