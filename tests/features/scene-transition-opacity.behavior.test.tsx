import { describe, expect, test } from '@jest/globals';
import { sceneOpacityForProgress } from '@/features/home/application/scene-transition-opacity';

describe('shared scene transition opacity', () => {
  test.each([0, 0.25, 0.5, 0.75, 1])('sets incoming scene base opacity to progress %s', (progress) => {
    expect(sceneOpacityForProgress('incoming', progress)).toBe(progress);
  });

  test.each([0, 0.25, 0.5, 0.75, 1])('fades outgoing scene from the same progress %s', (progress) => {
    expect(sceneOpacityForProgress('outgoing', progress)).toBe(1 - progress);
  });

  test('preserves partial source opacity when a transition is retargeted', () => {
    expect(sceneOpacityForProgress('incoming', 0.5, 0.3)).toBeCloseTo(0.65);
    expect(sceneOpacityForProgress('outgoing', 0.5, 0.3)).toBeCloseTo(0.15);
  });
});
