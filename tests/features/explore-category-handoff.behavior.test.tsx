import { describe, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useReducer } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

let mockRouteParams: { category?: string; focus?: string; entry?: string; query?: string } = {};
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockRouteParams }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import ExploreScreen from '@/features/places/presentation/explore-screen';
import { AppBootstrapProvider } from '@/providers/app-bootstrap-provider';
import { PlacesProvider } from '@/providers/places-provider';

function renderExplore(onEventsPress?: (query: string) => void) {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, right: 0, bottom: 34, left: 0 } }}>
      <AppBootstrapProvider>
        <PlacesProvider>
          <ExploreRouteHarness onEventsPress={onEventsPress} />
        </PlacesProvider>
      </AppBootstrapProvider>
    </SafeAreaProvider>,
  );
}

function ExploreRouteHarness({ onEventsPress = jest.fn() }: { onEventsPress?: (query: string) => void }) {
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open Parks shortcut" onPress={() => { mockRouteParams = { category: 'Parks' }; refresh(); }} />
      <ExploreScreen onPlacePress={jest.fn()} onEventsPress={onEventsPress} />
    </View>
  );
}

describe('Home category handoff to Explore', () => {
  test('updates selected category when Home opens another shortcut after Explore is mounted', async () => {
    mockRouteParams = { category: 'Pharmacy' };
    renderExplore();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Pharmacy' }).props.accessibilityState.selected).toBe(true));
    expect(await screen.findByText('Kavach Pharmacy')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Open Parks shortcut' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Parks' }).props.accessibilityState.selected).toBe(true));
    expect(await screen.findByText('Leisure Valley Park')).toBeTruthy();
    expect(screen.queryByText('Kavach Pharmacy')).toBeNull();
  });

  test('restores an incoming search query, shows matching events separately, and carries it to Events', async () => {
    const onEventsPress = jest.fn();
    mockRouteParams = { query: 'Acoustic', entry: 'event-search' };
    await renderExplore(onEventsPress);

    expect(await screen.findByText('Acoustic Evenings')).toBeTruthy();
    expect(screen.getByText('No places found')).toBeTruthy();
    expect(screen.getByText(/Thu|In 3 days|Today|Tomorrow/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'See all in Events' }));
    expect(onEventsPress).toHaveBeenCalledWith('Acoustic');
    expect(screen.queryByText('Open Mic Comedy Night')).toBeNull();
  });

  test('shows verified hospitals in Explore without Demo labels or invented distances', async () => {
    mockRouteParams = { category: 'Hospitals' };
    await renderExplore();

    expect(screen.getByRole('button', { name: 'Hospitals' }).props.accessibilityState.selected).toBe(true);
    expect(await screen.findByText('Medanta – The Medicity')).toBeTruthy();
    expect(screen.getAllByText('Real place · address verified 24 Nov 2026')).toHaveLength(6);
    expect(screen.queryByText('In an emergency, call 112.')).toBeNull();
    expect(screen.getAllByLabelText(/^Directions to /)).toHaveLength(6);
    expect(screen.queryByText(/\b\d+(?:\.\d+)?\s?km\b/i)).toBeNull();
    expect(screen.queryByText(/DEMO/)).toBeNull();
  });

  test('finds all supplied hospitals from the emergency search alias', async () => {
    mockRouteParams = { query: 'emergency', entry: 'hospital-search' };
    await renderExplore();

    expect(await screen.findByText('Civil Hospital, Sector 10 (Government)')).toBeTruthy();
    expect(screen.getAllByLabelText(/^Directions to /)).toHaveLength(6);
    expect(screen.queryByText('In an emergency, call 112.')).toBeNull();
  });

  test('shows no emergency copy on Clinics & Doctors, Diagnostic Labs, or Pet Clinics', async () => {
    for (const category of ['Clinics & Doctors', 'Diagnostic Labs', 'Pet Clinics']) {
      mockRouteParams = { category, entry: category };
      await renderExplore();
      expect(screen.queryByText(/emergency/i)).toBeNull();
      cleanup();
    }
  });
});
