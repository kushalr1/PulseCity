import { describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { AppText } from '@/components/ui/app-text';
import { loadAppBootstrapState } from '@/providers/app-bootstrap';
import { AppBootstrapProvider, useAppBootstrap } from '@/providers/app-bootstrap-provider';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('app bootstrap', () => {
  test('uses safe defaults and logs when storage hydration fails', async () => {
    const error = new Error('storage unavailable');
    const logger = jest.fn();

    const state = await loadAppBootstrapState(
      async () => { throw error; },
      logger,
    );

    expect(state.selectedArea).toEqual({ name: 'Sector 29', city: 'Gurugram' });
    expect(state.savedPlaceIds).toEqual([]);
    expect(state.savedEventIds).toEqual([]);
    expect(logger).toHaveBeenCalledWith('PulseCity storage hydration failed; starting with defaults.', error);
  });

  test('uses safe defaults instead of waiting forever for storage', async () => {
    const logger = jest.fn();
    const state = await loadAppBootstrapState(() => new Promise(() => {}), logger, 5);

    expect(state.selectedArea).toEqual({ name: 'Sector 29', city: 'Gurugram' });
    expect(state.savedPlaceIds).toEqual([]);
    expect(state.savedEventIds).toEqual([]);
    expect(logger).toHaveBeenCalledTimes(1);
  });

  test('does not persist timeout defaults and merges late stored saves with saves made meanwhile', async () => {
    let finishRead!: (value: string | null) => void;
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(AsyncStorage, 'getItem').mockImplementation(() => new Promise((resolve) => { finishRead = resolve; }));
    const setItem = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue(undefined);

    function Harness() {
      const { state, updateState } = useAppBootstrap();
      if (!state) return null;
      return (
        <>
          <AppText>{state.selectedArea.name}</AppText>
          <AppText>{state.savedPlaces.map((place) => place.id).join(',')}</AppText>
          <AppText>{state.savedEvents.map((event) => event.id).join(',')}</AppText>
          <AppText>{state.theme}</AppText>
          <AppText>{String(state.demoSignedIn)}</AppText>
          <AppText accessibilityRole="button" onPress={() => updateState({ savedPlaces: [{ id: 'new', savedAt: '2026-11-23T10:00:00Z', cached: { name: 'New', category: 'Cafe', area: 'Sector 29' } }], savedPlaceIds: ['new'] })}>
            Save during hydration
          </AppText>
        </>
      );
    }

    render(<AppBootstrapProvider hydrationTimeoutMs={5}><Harness /></AppBootstrapProvider>);
    await waitFor(() => expect(screen.getByText('Sector 29')).toBeTruthy());
    await fireEvent.press(screen.getByText('Save during hydration'));

    expect(setItem).not.toHaveBeenCalled();

    await act(async () => finishRead(JSON.stringify({
      version: 1,
      selectedArea: { name: 'Cyber City', city: 'Gurugram' },
      demoSignedIn: true,
      theme: 'winter',
      savedPlaces: [{ id: 'old', savedAt: '2026-11-22T10:00:00Z', cached: { name: 'Old', category: 'Cafe', area: 'Sector 29' } }],
      savedEvents: [{ id: 'event-1', savedAt: '2026-11-22T10:00:00Z', cached: { name: 'Event', dateTime: '2026-11-24T19:00:00Z', venue: 'Studio' } }],
    })));

    await waitFor(() => expect(setItem).toHaveBeenCalledTimes(1));
    const saved = JSON.parse(setItem.mock.calls[0][1]);
    expect(saved.selectedArea.name).toBe('Cyber City');
    expect(saved.demoSignedIn).toBe(true);
    expect(saved.theme).toBe('winter');
    expect(saved.savedPlaces.map((place: { id: string }) => place.id).sort()).toEqual(['new', 'old']);
    expect(saved.savedEvents.map((event: { id: string }) => event.id)).toEqual(['event-1']);
    log.mockRestore();
  });

  test('renders currency and punctuation glyphs with Inter Tight', async () => {
    const view = await render(<AppText>₹ ≈ ·</AppText>);

    expect(view.getByText('₹ ≈ ·').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontFamily: 'InterTight_400Regular' })]),
    );
  });
});
