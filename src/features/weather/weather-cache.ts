export const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

export type WeatherSnapshot = { temperatureC: number; weatherCode: number; fetchedAt: number };

export type WeatherDisplay =
  | { kind: 'hidden' }
  | { kind: 'current'; temperatureC: number; weatherCode: number }
  | { kind: 'stale'; temperatureC: number; weatherCode: number; ageLabel: string };

export function resolveWeatherDisplay(snapshot: WeatherSnapshot | null, nowMs: number): WeatherDisplay {
  if (!snapshot || !Number.isFinite(snapshot.temperatureC) || !Number.isFinite(snapshot.fetchedAt)) return { kind: 'hidden' };
  const ageMs = Math.max(0, nowMs - snapshot.fetchedAt);
  if (ageMs <= WEATHER_CACHE_TTL_MS) {
    return { kind: 'current', temperatureC: snapshot.temperatureC, weatherCode: snapshot.weatherCode };
  }
  return {
    kind: 'stale',
    temperatureC: snapshot.temperatureC,
    weatherCode: snapshot.weatherCode,
    ageLabel: formatWeatherAge(ageMs),
  };
}

export function formatWeatherAge(ageMs: number): string {
  const minutes = Math.max(1, Math.floor(ageMs / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr${hours === 1 ? '' : 's'} ago`;
}
