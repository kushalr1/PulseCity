import { describe, expect, test } from '@jest/globals';
import { isSurfaceVisible } from '@/features/home/application/home-surface-visibility';

describe('Home scene visibility', () => {
  test('initializes visible surface state from current layout and scroll position', () => {
    expect(isSurfaceVisible(0, 800, 900, 300)).toBe(false);
    expect(isSurfaceVisible(0, 800, 700, 300)).toBe(true);
    expect(isSurfaceVisible(850, 800, 700, 300)).toBe(true);
    expect(isSurfaceVisible(1100, 800, 700, 300)).toBe(false);
  });
});
