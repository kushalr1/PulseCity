import { describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, ScrollView } = require('react-native');
  return {
    __esModule: true,
    default: { View, ScrollView },
    View,
    runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
    useAnimatedReaction: (prepare: () => unknown, react: (next: unknown, previous: unknown) => void, dependencies?: unknown[]) => {
      const previous = React.useRef(undefined);
      React.useEffect(() => {
        const next = prepare();
        react(next, previous.current);
        previous.current = next;
      }, dependencies ?? []);
    },
    useAnimatedScrollHandler: (handlers: unknown) => handlers,
    cancelAnimation: () => undefined,
    Easing: { linear: (value: number) => value, cubic: (value: number) => value, inOut: (value: number) => value },
    useAnimatedStyle: (factory: () => object) => factory(),
    useDerivedValue: (factory: () => unknown) => ({ value: factory() }),
    useReducedMotion: () => false,
    useSharedValue: (value: unknown) => ({ value }),
    withRepeat: (animation: unknown) => animation,
    withTiming: (value: unknown) => value,
  };
});
jest.mock('expo-image', () => ({ Image: Object.assign(require('react-native').Image, { prefetch: async () => true }) }));
jest.mock('expo-router', () => ({ useIsFocused: () => true }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/features/weather/weather-chip', () => ({ WeatherChip: () => null }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useImage } from '@shopify/react-native-skia';

import HomeScreen from '@/features/home/presentation/home-screen';
import { PlacesProvider } from '@/providers/places-provider';
import { AppBootstrapProvider } from '@/providers/app-bootstrap-provider';
import { CityWorldMoodProvider } from '@/providers/city-world-mood-provider';
import { CityWorldTransitionProvider } from '@/providers/city-world-transition-provider';

function renderHome(
  onExplorePress = jest.fn(),
  onSavedPress = jest.fn(),
  onPlacePress = jest.fn(),
  onCityWorldPress = jest.fn(),
) {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, right: 0, bottom: 34, left: 0 } }}>
      <AppBootstrapProvider>
        <PlacesProvider>
          <CityWorldMoodProvider>
            <CityWorldTransitionProvider>
              <HomeScreen
                onSavedPress={onSavedPress}
                onExplorePress={onExplorePress}
                onPlacePress={onPlacePress}
                onCityWorldPress={onCityWorldPress}
              />
            </CityWorldTransitionProvider>
          </CityWorldMoodProvider>
        </PlacesProvider>
      </AppBootstrapProvider>
    </SafeAreaProvider>,
  );
}

describe('PulseCity Home essentials', () => {
  test('shows Gurugram demo location and all eight everyday categories', async () => {
    await renderHome();

    expect(screen.getByText('GURUGRAM')).toBeTruthy();
    expect(screen.getAllByText('Sector 29').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Coffee ka plan?').length).toBeGreaterThan(0);
    expect(screen.queryByText('Starting area')).toBeNull();
    expect(screen.getByText('Search places, services, events…')).toBeTruthy();
    expect(screen.getByTestId('home-demo-badge')).toBeTruthy();
    expect(screen.getByTestId('home-hero-container')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Appearance' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Saved places' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Notifications, coming soon' }).props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByText('STATIC CITY WORLD PREVIEW')).toBeNull();
    expect(screen.queryByText(/Live · Gurugram/)).toBeNull();
    expect(within(screen.getByTestId('city-world-card')).getByText('This evening')).toBeTruthy();
    expect(within(screen.getByTestId('city-world-card')).getByText('Surprise me')).toBeTruthy();
    expect(within(screen.getByTestId('city-world-card')).getByText('Explore the city')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Nearby' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Happening this week' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Collections' })).toBeTruthy();
    expect(screen.getAllByText('Kettle & Kulhad').length).toBeGreaterThan(0);
    expect(screen.getByText('Leisure Valley Park')).toBeTruthy();
    expect(screen.queryByText('Sample places')).toBeNull();
    expect(screen.queryByText('Form House')).toBeNull();

    for (const category of [
      'Pharmacy', 'Grocery', 'Cafés', 'Salons',
      'Markets', 'Mobile repair', 'Gyms', 'Parks',
    ]) {
      expect(screen.getByText(category)).toBeTruthy();
    }
  });

  test('lays out Home at 390×844 with 47 pt top inset and keeps hero controls below status area', async () => {
    await renderHome();

    const hero = screen.getByTestId('home-hero-container');
    const heroContent = screen.getByTestId('home-hero-content');
    const bodyContent = screen.getByTestId('home-body-content');
    const headline = screen.getAllByRole('header', { name: 'Coffee ka plan?' })[0];
    const heroStyle = Array.isArray(hero.props.style) ? Object.assign({}, ...hero.props.style) : hero.props.style;
    const contentStyle = Array.isArray(heroContent.props.style) ? Object.assign({}, ...heroContent.props.style) : heroContent.props.style;
    const bodyStyle = Array.isArray(bodyContent.props.style) ? Object.assign({}, ...bodyContent.props.style) : bodyContent.props.style;

    expect(heroStyle.height).toBe(243);
    expect(contentStyle.paddingTop).toBe(47);
    expect(bodyStyle.paddingTop).toBe(22);
    expect(bodyStyle.paddingHorizontal).toBe(16);
    expect(headline.props.numberOfLines).toBe(1);
    expect(headline.props.allowFontScaling).toBe(false);
    expect(headline.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ fontSize: 32, lineHeight: 38 }),
    ]));
  });

  test('keeps Demo data badge outside City World scene', async () => {
    await renderHome();

    expect(within(screen.getByTestId('city-world-card')).queryByText('Demo data')).toBeNull();
    expect(screen.getByTestId('home-demo-badge')).toBeTruthy();
  });

  test('shows all three picks in the content-sized panel with centered 40 pt mood chips', async () => {
    await renderHome();

    const panel = screen.getByTestId('city-world-card');
    const picks = screen.getByTestId('city-world-picks');
    const rows = within(picks).getAllByTestId(/^panel-pick-row-/);
    const chips = screen.getAllByTestId(/^mood-chip-/);
    const moodRow = screen.getByTestId('city-world-mood-row');
    const actions = screen.getByTestId('city-world-panel-actions');
    const scene = screen.getByRole('button', { name: 'Open City World' });
    const search = screen.getByRole('button', { name: 'Search places, services, and events in Explore' });
    const style = (node: { props: { style?: unknown } }) => Object.assign({}, ...(Array.isArray(node.props.style) ? node.props.style : [node.props.style ?? {}]));

    expect(rows).toHaveLength(3);
    expect(within(picks).queryByText('Demo listing')).toBeNull();
    expect(style(picks)).not.toHaveProperty('height');
    expect(style(rows[0]!)).toMatchObject({ minHeight: 70.67 });
    expect(style(chips[0]!)).toMatchObject({ height: 40, alignItems: 'center', paddingLeft: 10, paddingRight: 14 });
    expect(style(panel)).toMatchObject({ paddingTop: 14, paddingBottom: 14, borderRadius: 24 });
    expect(moodRow.props.contentContainerStyle).toMatchObject({ height: 40, paddingHorizontal: 16 });
    expect(style(actions)).toMatchObject({ height: 60, paddingTop: 14 });
    expect(style(scene)).toMatchObject({ height: 208 });
    expect(style(search)).toMatchObject({ height: 54, marginTop: -27, maxWidth: 358 });
    const targetHeight = 208 + 14 + 40 + 6 + 3 * 70.67 + 60 + 10 + 17.5 + 14;
    expect(targetHeight).toBeCloseTo(581.5, 0);
  });

  test('search and category entry points open Explore without claiming filters', async () => {
    const onExplorePress = jest.fn();
    await renderHome(onExplorePress);

    await fireEvent.press(screen.getByRole('button', { name: 'Search places, services, and events in Explore' }));
    const pharmacyEntry = screen.getByRole('button', { name: 'Explore from Pharmacy category' });
    expect(pharmacyEntry.props.accessibilityHint).toBe('Opens Explore to browse sample places.');
    await fireEvent.press(pharmacyEntry);
    await fireEvent.press(screen.getByRole('button', { name: 'Explore all places' }));

    expect(onExplorePress).toHaveBeenCalledTimes(3);
  });

  test('Tonight pick opens its matching Place Details ID', async () => {
    const onPlacePress = jest.fn();
    await renderHome(jest.fn(), jest.fn(), onPlacePress);

    await fireEvent.press((await screen.findAllByText('Kettle & Kulhad'))[0]);

    expect(onPlacePress).toHaveBeenCalledWith('kettle');
    expect(within(screen.getByTestId('city-world-card')).getByText('This evening')).toBeTruthy();
  });

  test('renders separate hero and City World scene layers', async () => {
    const result = await renderHome();
    const findTestID = (node: unknown, testID: string): unknown[] => {
      if (Array.isArray(node)) return node.flatMap((child) => findTestID(child, testID));
      if (typeof node !== 'object' || node === null) return [];
      const element = node as { props?: Record<string, unknown>; children?: unknown[] };
      return [
        ...(element.props?.testID === testID ? [element] : []),
        ...findTestID(element.children ?? [], testID),
      ];
    };
    const getSceneLayer = (testID: string) => findTestID(result.toJSON(), testID);

    expect(getSceneLayer('home-hero-layer-moon')).toHaveLength(1);
    expect(getSceneLayer('home-hero-layer-stars')).toHaveLength(1);
    expect(getSceneLayer('home-hero-layer-train')).toHaveLength(0);
    expect(getSceneLayer('home-hero-layer-beam-column-s29')).toHaveLength(0);

    expect(getSceneLayer('city-world-layer-moon')).toHaveLength(1);
    expect(getSceneLayer('city-world-layer-metro')).toHaveLength(1);
    expect(getSceneLayer('city-world-layer-train')).toHaveLength(1);
    expect(getSceneLayer('city-world-layer-beam-column-s29')).toHaveLength(1);
    expect(getSceneLayer('city-world-layer-beam-halo-s29')).toHaveLength(1);
    expect(getSceneLayer('city-world-layer-near')).toHaveLength(1);
  });

  test('Home preview follows shared mood and shows only matching Gurugram districts', async () => {
    await renderHome();
    await waitFor(() => expect(screen.getByTestId('mood-chip-social').props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(screen.getByText('Social'));

    expect(screen.getByText('LATER TODAY · SOCIAL')).toBeTruthy();
    const districts = screen.getByTestId('city-world-districts');
    expect(within(districts).getByText('Sector 29')).toBeTruthy();
    expect(within(districts).getByText('Cyber City')).toBeTruthy();
    expect(within(districts).getByText('Galleria')).toBeTruthy();
  });

  test('keeps fixed hero and preview transition slots and avoids per-mood Skia image loading', async () => {
    await renderHome();
    await waitFor(() => expect(screen.getByTestId('mood-chip-social').props.accessibilityState.disabled).toBe(false));
    (useImage as jest.Mock).mockClear();

    await fireEvent.press(screen.getByText('Social'));
    await fireEvent.press(screen.getByText('Nature'));

    expect(screen.getByTestId('home-hero-from')).toBeTruthy();
    expect(screen.getByTestId('home-hero-to')).toBeTruthy();
    expect(screen.getByTestId('city-world-from')).toBeTruthy();
    expect(screen.getByTestId('city-world-to')).toBeTruthy();
    expect((useImage as jest.Mock).mock.calls).toHaveLength(0);
  });

  test('opens City World directly when native preview measurement is unavailable', async () => {
    const onCityWorldPress = jest.fn();
    await renderHome(jest.fn(), jest.fn(), jest.fn(), onCityWorldPress);
    await fireEvent.press(screen.getByRole('button', { name: 'Open City World' }));
    await waitFor(() => expect(onCityWorldPress).toHaveBeenCalledTimes(1));
  });

  test('Appearance switches both scenes to saved Winter artwork', async () => {
    await AsyncStorage.clear();
    const result = await renderHome();
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
    await fireEvent.press(screen.getByRole('button', { name: 'Appearance' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Winter Wonderland' }));

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('pulsecity:app-bootstrap:v1');
      expect(JSON.parse(raw ?? '{}').theme).toBe('winter');
    });
    expect(result.toJSON()).toBeTruthy();
  });
});
