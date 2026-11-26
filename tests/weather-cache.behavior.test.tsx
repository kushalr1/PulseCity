import { describe, expect, jest, test } from '@jest/globals';

import { resolveWeatherDisplay } from '@/features/weather/weather-cache';
import { loadWeatherSnapshot } from '@/features/weather/weather-service';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('weather cache display', () => {
  test('hides weather before first successful response', () => {
    expect(resolveWeatherDisplay(null, 1_000_000)).toEqual({ kind: 'hidden' });
  });

  test('shows cached weather as current through the 15-minute cache window', () => {
    expect(resolveWeatherDisplay({ temperatureC: 21, weatherCode: 1, fetchedAt: 100_000 }, 1_000_000)).toEqual({
      kind: 'current', temperatureC: 21, weatherCode: 1,
    });
  });

  test('shows stale offline weather with its age after 15 minutes', () => {
    expect(resolveWeatherDisplay({ temperatureC: 21, weatherCode: 1, fetchedAt: 0 }, 960_000)).toEqual({
      kind: 'stale', temperatureC: 21, weatherCode: 1, ageLabel: '16 min ago',
    });
  });

  test('reuses fresh cache without a network request', async () => {
    const fetcher = jest.fn(async () => { throw new Error('unexpected network request'); }) as unknown as typeof fetch;
    const snapshot = { temperatureC: 21, weatherCode: 1, fetchedAt: 0 };
    const loaded = await loadWeatherSnapshot({ latitude: 28.46, longitude: 77.03 }, {
      read: async () => JSON.stringify(snapshot),
      write: async () => undefined,
      fetcher,
      now: () => 900_000,
    });

    expect(loaded).toEqual(snapshot);
    expect(fetcher).not.toHaveBeenCalled();
  });

  test('returns stale cache after offline refresh failure', async () => {
    const fetcher = jest.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    const snapshot = { temperatureC: 21, weatherCode: 1, fetchedAt: 0 };
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const loaded = await loadWeatherSnapshot({ latitude: 28.46, longitude: 77.03 }, {
      read: async () => JSON.stringify(snapshot),
      write: async () => undefined,
      fetcher,
      now: () => 960_000,
    });

    expect(loaded).toEqual(snapshot);
    expect(resolveWeatherDisplay(loaded, 960_000)).toMatchObject({ kind: 'stale', ageLabel: '16 min ago' });
    log.mockRestore();
  });
});
