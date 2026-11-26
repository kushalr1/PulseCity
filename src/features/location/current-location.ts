import * as Location from 'expo-location';

import { gurugramAreaOptions, type GurugramAreaOption } from '@/features/location/area-options';
import type { BootstrapArea } from '@/providers/app-bootstrap';

export type CurrentLocationResult =
  | { status: 'located'; area: BootstrapArea }
  | { status: 'permission-denied' }
  | { status: 'outside-coverage' }
  | { status: 'unavailable' };

export function isWithinGurugramCoverage(latitude: number, longitude: number) {
  return latitude >= 28.30 && latitude <= 28.55 && longitude >= 76.83 && longitude <= 77.17;
}

export async function requestCurrentLocation(): Promise<CurrentLocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return { status: 'permission-denied' };

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = position.coords;
    if (!isWithinGurugramCoverage(latitude, longitude)) return { status: 'outside-coverage' };

    const closest = nearestArea(latitude, longitude);
    return {
      status: 'located',
      area: { name: closest.name, city: 'Gurugram', latitude, longitude },
    };
  } catch (error) {
    console.error('PulseCity current location unavailable.', error);
    return { status: 'unavailable' };
  }
}

function nearestArea(latitude: number, longitude: number): GurugramAreaOption {
  return gurugramAreaOptions.reduce((nearest, option) => (
    distanceSquared(latitude, longitude, option.latitude, option.longitude)
      < distanceSquared(latitude, longitude, nearest.latitude, nearest.longitude) ? option : nearest
  ));
}

function distanceSquared(aLat: number, aLon: number, bLat: number, bLon: number) {
  return (aLat - bLat) ** 2 + (aLon - bLon) ** 2;
}
