import type { BootstrapArea } from '@/providers/app-bootstrap';

export type SavedPlaceSnapshot = {
  id: string;
  savedAt: string;
  cached: { name: string; category: string; area: string };
};

export type SavedEventSnapshot = {
  id: string;
  savedAt: string;
  cached: { name: string; dateTime: string; venue: string };
};

export type StoredAppState = {
  version: 1;
  selectedArea: BootstrapArea;
  demoSignedIn: boolean;
  theme: 'city' | 'winter';
  savedPlaces: SavedPlaceSnapshot[];
  savedEvents: SavedEventSnapshot[];
};

export const DEFAULT_STORED_APP_STATE: StoredAppState = {
  version: 1,
  selectedArea: { name: 'Sector 29', city: 'Gurugram' },
  demoSignedIn: false,
  theme: 'city',
  savedPlaces: [],
  savedEvents: [],
};

export function decodeStoredAppState(raw: string | null): StoredAppState {
  if (raw === null) return DEFAULT_STORED_APP_STATE;

  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.selectedArea)
    || typeof value.selectedArea.name !== 'string' || typeof value.selectedArea.city !== 'string'
    || (value.selectedArea.latitude !== undefined && typeof value.selectedArea.latitude !== 'number')
    || (value.selectedArea.longitude !== undefined && typeof value.selectedArea.longitude !== 'number')
    || typeof value.demoSignedIn !== 'boolean' || (value.theme !== 'city' && value.theme !== 'winter')
    || !Array.isArray(value.savedPlaces) || !value.savedPlaces.every(isSavedPlaceSnapshot)
    || !Array.isArray(value.savedEvents) || !value.savedEvents.every(isSavedEventSnapshot)) {
    throw new Error('Invalid PulseCity storage schema');
  }

  return value as StoredAppState;
}

export function resolveSavedPlace(saved: SavedPlaceSnapshot, currentPlaceId: string | undefined) {
  return currentPlaceId
    ? { status: 'available' as const, saved }
    : { status: 'no-longer-available' as const, saved };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSavedPlaceSnapshot(value: unknown): value is SavedPlaceSnapshot {
  return isRecord(value) && typeof value.id === 'string' && typeof value.savedAt === 'string'
    && isRecord(value.cached) && typeof value.cached.name === 'string'
    && typeof value.cached.category === 'string' && typeof value.cached.area === 'string';
}

function isSavedEventSnapshot(value: unknown): value is SavedEventSnapshot {
  return isRecord(value) && typeof value.id === 'string' && typeof value.savedAt === 'string'
    && isRecord(value.cached) && typeof value.cached.name === 'string'
    && typeof value.cached.dateTime === 'string' && typeof value.cached.venue === 'string';
}
