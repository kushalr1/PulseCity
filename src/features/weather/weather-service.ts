import AsyncStorage from '@react-native-async-storage/async-storage';

import { resolveWeatherDisplay, type WeatherSnapshot } from '@/features/weather/weather-cache';

const WEATHER_STORAGE_KEY = 'pulsecity:weather-cache:v1';

export type WeatherCoordinates = { latitude: number; longitude: number };

type WeatherDependencies = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => Promise<void>;
  fetcher: typeof fetch;
  now: () => number;
};

const defaults: WeatherDependencies = {
  read: (key) => AsyncStorage.getItem(key),
  write: (key, value) => AsyncStorage.setItem(key, value),
  fetcher: fetch,
  now: Date.now,
};

export async function loadWeatherSnapshot(
  coordinates: WeatherCoordinates,
  dependencies: WeatherDependencies = defaults,
): Promise<WeatherSnapshot | null> {
  let cached: WeatherSnapshot | null = null;
  const cacheKey = `${WEATHER_STORAGE_KEY}:${coordinates.latitude.toFixed(3)}:${coordinates.longitude.toFixed(3)}`;
  try {
    const raw = await dependencies.read(cacheKey);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isWeatherSnapshot(parsed)) cached = parsed;
    }
  } catch (error) {
    console.error('PulseCity weather cache read failed.', error);
  }

  if (cached && resolveWeatherDisplay(cached, dependencies.now()).kind === 'current') return cached;

  try {
    const query = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      current: 'temperature_2m,weather_code',
      temperature_unit: 'celsius',
      timezone: 'auto',
    });
    const response = await dependencies.fetcher(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
    if (!response.ok) throw new Error(`Open-Meteo request failed with ${response.status}`);
    const body: unknown = await response.json();
    if (!isWeatherResponse(body)) throw new Error('Open-Meteo returned an invalid current weather response');
    const next: WeatherSnapshot = {
      temperatureC: body.current.temperature_2m,
      weatherCode: body.current.weather_code,
      fetchedAt: dependencies.now(),
    };
    try {
      await dependencies.write(cacheKey, JSON.stringify(next));
    } catch (error) {
      console.error('PulseCity weather cache write failed.', error);
    }
    return next;
  } catch (error) {
    console.error('PulseCity live weather request failed.', error);
    return cached;
  }
}

function isWeatherSnapshot(value: unknown): value is WeatherSnapshot {
  return typeof value === 'object' && value !== null
    && 'temperatureC' in value && typeof value.temperatureC === 'number' && Number.isFinite(value.temperatureC)
    && 'weatherCode' in value && typeof value.weatherCode === 'number' && Number.isFinite(value.weatherCode)
    && 'fetchedAt' in value && typeof value.fetchedAt === 'number' && Number.isFinite(value.fetchedAt);
}

function isWeatherResponse(value: unknown): value is { current: { temperature_2m: number; weather_code: number } } {
  if (typeof value !== 'object' || value === null || !('current' in value)) return false;
  const current = value.current;
  return typeof current === 'object' && current !== null
    && 'temperature_2m' in current && typeof current.temperature_2m === 'number'
    && 'weather_code' in current && typeof current.weather_code === 'number';
}
