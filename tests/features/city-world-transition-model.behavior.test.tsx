import { describe, expect, test } from '@jest/globals';

import { cityWorldTransitionDuration, startCityWorldTransition, transitionBounds } from '@/features/home/application/city-world-transition';

describe('City World preview transition model', () => {
  test('interpolates preview bounds to full screen without a jump', () => {
    const preview = { x: 16, y: 300, width: 358, height: 208 };
    const screen = { x: 0, y: 0, width: 390, height: 844 };
    expect(transitionBounds(preview, screen, 0)).toEqual(preview);
    expect(transitionBounds(preview, screen, 0.5)).toEqual({ x: 8, y: 150, width: 374, height: 526 });
    expect(transitionBounds(preview, screen, 1)).toEqual(screen);
  });

  test('keeps bounds interpolation callable from a Reanimated worklet', () => {
    expect(transitionBounds).toHaveProperty('__workletHash');
  });

  test('bypasses transition animation when reduced motion is enabled', () => {
    expect(cityWorldTransitionDuration(true)).toBe(0);
    expect(cityWorldTransitionDuration(false)).toBe(650);
  });

  test('starts preview layer before navigating, and navigates directly without valid bounds', () => {
    const order: string[] = [];
    const bounds = { x: 10, y: 20, width: 300, height: 180 };
    startCityWorldTransition(bounds, false, () => order.push('begin'), () => order.push('navigate'));
    expect(order).toEqual(['begin', 'navigate']);

    order.length = 0;
    startCityWorldTransition(null, false, () => order.push('begin'), () => order.push('navigate'));
    expect(order).toEqual(['navigate']);
  });
});
