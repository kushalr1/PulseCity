import { describe, expect, test } from '@jest/globals';

import { decodeStoredAppState, resolveSavedPlace } from '@/features/storage/storage-schema';

describe('saved state storage', () => {
  test('decodes versioned saved-place metadata for offline display', () => {
    const state = decodeStoredAppState(JSON.stringify({
      version: 1,
      selectedArea: { name: 'Sector 29', city: 'Gurugram' },
      demoSignedIn: false,
      theme: 'city',
      savedPlaces: [{ id: 'p1', savedAt: '2026-11-23T10:00:00Z', cached: { name: 'Kettle & Kulhad', category: 'Cafés', area: 'Sector 29' } }],
      savedEvents: [],
    }));

    expect(state.savedPlaces[0].cached.name).toBe('Kettle & Kulhad');
    expect(state.version).toBe(1);
  });

  test('marks removed demo place as no longer available and retains cached details', () => {
    const saved = { id: 'gone', savedAt: '2026-11-23T10:00:00Z', cached: { name: 'Old place', category: 'Cafés', area: 'Sector 29' } };

    expect(resolveSavedPlace(saved, undefined)).toEqual({ status: 'no-longer-available', saved });
  });
});
