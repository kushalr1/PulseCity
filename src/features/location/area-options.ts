import type { BootstrapArea } from '@/providers/app-bootstrap';
import type { WeatherCoordinates } from '@/features/weather/weather-service';

export type GurugramAreaOption = BootstrapArea & WeatherCoordinates;

export const gurugramAreaOptions: GurugramAreaOption[] = [
  { name: 'Sector 29', city: 'Gurugram', latitude: 28.4595, longitude: 77.0266 },
  { name: 'Sohna Road', city: 'Gurugram', latitude: 28.4186, longitude: 77.0417 },
  { name: 'Cyber City', city: 'Gurugram', latitude: 28.4948, longitude: 77.0895 },
  { name: 'Golf Course Road', city: 'Gurugram', latitude: 28.4401, longitude: 77.1010 },
  { name: 'Old Gurugram', city: 'Gurugram', latitude: 28.4642, longitude: 77.0299 },
];

export function getAreaCoordinates(area: BootstrapArea): WeatherCoordinates {
  if (typeof area.latitude === 'number' && typeof area.longitude === 'number') {
    return { latitude: area.latitude, longitude: area.longitude };
  }
  const match = gurugramAreaOptions.find((option) => option.name === area.name);
  return match
    ? { latitude: match.latitude, longitude: match.longitude }
    : { latitude: 28.4595, longitude: 77.0266 };
}
