import { describe, expect, test } from '@jest/globals';

import { formatDistanceLabel } from '@/features/location/distance-label';

describe('distance labels', () => {
  test('labels manual-area straight-line estimate with the selected area', () => {
    expect(formatDistanceLabel(400, 'Sector 29', 'selected-area')).toBe('≈ 400 m from Sector 29');
  });

  test('labels device distance and formats kilometers', () => {
    expect(formatDistanceLabel(6000, 'Sector 29', 'device')).toBe('≈ 6.0 km from your location');
  });
});
