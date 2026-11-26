import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { resolveWeatherDisplay, type WeatherSnapshot } from '@/features/weather/weather-cache';
import { loadWeatherSnapshot, type WeatherCoordinates } from '@/features/weather/weather-service';

export function WeatherChip({ coordinates }: { coordinates: WeatherCoordinates }) {
  const [result, setResult] = useState<{ coordinatesKey: string; snapshot: WeatherSnapshot | null; nowMs: number } | null>(null);
  const { latitude, longitude } = coordinates;
  const coordinatesKey = `${latitude.toFixed(3)}:${longitude.toFixed(3)}`;

  useEffect(() => {
    let active = true;
    void loadWeatherSnapshot({ latitude, longitude }).then((weather) => {
      if (active) setResult({ coordinatesKey, snapshot: weather, nowMs: Date.now() });
    });
    return () => { active = false; };
  }, [coordinatesKey, latitude, longitude]);

  const display = result?.coordinatesKey === coordinatesKey
    ? resolveWeatherDisplay(result.snapshot, result.nowMs)
    : { kind: 'hidden' as const };
  if (display.kind === 'hidden') return null;

  return (
    <View accessibilityLabel={`Live weather ${Math.round(display.temperatureC)} degrees, ${weatherDescription(display.weatherCode)}${display.kind === 'stale' ? `, updated ${display.ageLabel}` : ''}`} style={styles.chip}>
      <AppText style={styles.temperature}>{Math.round(display.temperatureC)}°</AppText>
      <View>
        <AppText style={styles.condition}>{weatherDescription(display.weatherCode)}</AppText>
        <AppText style={styles.source}>{display.kind === 'stale' ? `Updated ${display.ageLabel}` : 'Live · Gurugram'}</AppText>
      </View>
    </View>
  );
}

function weatherDescription(code: number) {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Thunderstorms';
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 7, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 },
  temperature: { color: colors.text, fontSize: 20, fontWeight: '700' },
  condition: { color: colors.text, fontSize: 14, fontWeight: '600' },
  source: { color: colors.textMuted, fontSize: 12 },
});
