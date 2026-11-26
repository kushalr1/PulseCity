import { describe, expect, test } from '@jest/globals';
import { canRevealScene, shouldRevealScene } from '@/features/home/application/scene-readiness';

describe('scene readiness', () => {
  test('keeps the previous scene visible until every incoming image has loaded', () => {
    const required = ['sky', 'far', 'mid', 'near'];
    expect(canRevealScene(required, new Set(['sky', 'far', 'near']))).toBe(false);
    expect(canRevealScene(required, new Set(required))).toBe(true);
  });

  test('reveals a ready scene as soon as it becomes visible, without an added delay', () => {
    expect(shouldRevealScene(false, true)).toBe(false);
    expect(shouldRevealScene(true, true)).toBe(true);
    expect(shouldRevealScene(true, false)).toBe(false);
  });
});
