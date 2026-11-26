import { describe, expect, test } from '@jest/globals';
import { getWindowLightUniforms, interpolateWindowPalette, isWindowThresholdLit, litCodeForFraction, isCalibrationRampColumnCorrect, sceneTransitionFrame, snapshotWindowPalette } from '@/features/home/application/window-light-transition';
import { RAMP_CALIBRATION_SHADER, WINDOW_LIGHT_SHADER } from '@/features/home/presentation/window-light-shader';
import { calibrationRampRect, windowLightPlacement } from '@/features/home/application/window-light-placement';
import { windowLightLayers } from '@/features/home/window-light-assets';
import { getSceneSet } from '@/features/home/scene-registry';
import { getLightsDebugBadgeLabel, isLightsDebugTarget, resolveLightsDebugMode } from '@/features/home/application/window-light-debug-mode';

const chill = { lit: 0.24, win: [255, 217, 154] as const, haze: [127, 184, 200] as const, hazeAlpha: 0.12 };
const social = { lit: 0.8, win: [255, 143, 190] as const, haze: [168, 119, 202] as const, hazeAlpha: 0.28 };

describe('window-light mood transition', () => {
  test('decodes threshold bytes using float arithmetic outside half range', () => {
    expect(WINDOW_LIGHT_SHADER).toContain('uniform shader thr;');
    expect(WINDOW_LIGHT_SHADER).toContain('uniform shader cov;');
    expect(WINDOW_LIGHT_SHADER).toContain('uniform float litCode;');
    expect(WINDOW_LIGHT_SHADER).toContain('float T = floor(thr.eval(xy).r * 255.0 + 0.5);');
    expect(WINDOW_LIGHT_SHADER).toContain('if (T >= litCode) return half4(0);');
    expect(WINDOW_LIGHT_SHADER).not.toContain('65535');
  });

  test.each([[0, 0], [.10, 26], [.12, 31], [.24, 61], [.38, 97], [.50, 128], [.58, 148], [.80, 204], [1, 255]])(
    'maps mood lit fraction %s to the v2.2 threshold byte %s', (fraction, code) => {
      expect(litCodeForFraction(fraction)).toBeCloseTo(code);
    },
  );

  test('calibration ramp passes only when every sampled grey equals its column', () => {
    expect(RAMP_CALIBRATION_SHADER).toContain('floor(ramp.eval(xy).r * 255.0 + 0.5)');
    expect(RAMP_CALIBRATION_SHADER).toContain('abs(v - floor(xy.x)) < 0.5 ? half4(0, 1, 0, 1) : half4(1, 0, 0, 1)');
    expect(Array.from({ length: 256 }, (_, column) => isCalibrationRampColumnCorrect(column, column)).every(Boolean)).toBe(true);
    expect(isCalibrationRampColumnCorrect(127, 126)).toBe(false);
    expect(isCalibrationRampColumnCorrect(255, 0)).toBe(false);
  });

  test('calibration strip rect starts at shader-local origin and matches 256 source columns', () => {
    expect(calibrationRampRect).toEqual({ x: 0, y: 0, width: 256, height: 16 });
  });

  test('keeps light-mask sampling local and applies layer offset once', () => {
    expect(windowLightPlacement(windowLightLayers.preview.mid, 20, 1.5)).toEqual({
      rect: { x: 0, y: 0, width: 509, height: 107 },
      translateX: -12,
      translateY: 101,
      scale: 1.5,
    });
  });

  test('interpolates lit fraction and palette at the animated progress', () => {
    expect(interpolateWindowPalette(chill, social, 0)).toEqual({ lit: 0.24, win: [1, 217 / 255, 154 / 255], haze: [127 / 255, 184 / 255, 200 / 255], hazeAlpha: 0.12 });
    const halfway = interpolateWindowPalette(chill, social, 0.5);
    expect(halfway.lit).toBeCloseTo(0.52);
    expect(halfway.win[1]).toBeCloseTo(180 / 255);
    expect(halfway.hazeAlpha).toBeCloseTo(0.2);
    expect(interpolateWindowPalette(chill, social, 1).lit).toBe(0.8);
  });

  test.each([0, 0.25, 0.5, 0.75, 1])('derives base opacity, lit code, and tint from one progress frame at %s', (progress) => {
    const frame = sceneTransitionFrame(social, chill, progress);
    const expected = interpolateWindowPalette(social, chill, progress);
    expect(frame.progress).toBe(progress);
    expect(frame.baseOpacityB).toBe(progress);
    expect(frame.palette).toEqual(expected);
    expect(frame.litCode).toBeCloseTo(litCodeForFraction(expected.lit));
  });

  test('keeps Nature to Active threshold code within endpoint range during retarget', () => {
    const nature = { ...chill, lit: 0.12 };
    const active = { ...chill, lit: 0.10 };
    const codes = [0, 0.25, 0.5, 0.75, 1].map((p) => sceneTransitionFrame(nature, active, p).litCode);
    expect(codes.every((code) => code >= 26 && code <= 31)).toBe(true);
    expect(codes).not.toContain(255);
  });

  test('retarget snapshot preserves currently blended color and lit fraction', () => {
    const snapshot = snapshotWindowPalette(social, chill, 0.5);
    expect(snapshot.lit).toBeCloseTo(0.52);
    expect(snapshot.win[0]).toBe(255);
    expect(snapshot.win[1]).toBe(180);
    expect(snapshot.hazeAlpha).toBeCloseTo(0.2);
  });

  test('switches each window at its fixed threshold', () => {
    expect(isWindowThresholdLit(0.51, 0.52)).toBe(true);
    expect(isWindowThresholdLit(0.52, 0.52)).toBe(false);
    expect(isWindowThresholdLit(0.53, 0.52)).toBe(false);
  });

  test('uses lit fractions from mood scene data', () => {
    expect((getSceneSet('preview', 'city', 'social').scene as any).palette.lit).toBe(0.8);
    expect((getSceneSet('preview', 'city', 'chill').scene as any).palette.lit).toBe(0.24);
    expect((getSceneSet('preview', 'winter', 'nature').scene as any).palette.lit).toBe(0.5);
  });

  test('debug all-on mode forces warm light uniforms', () => {
    const uniforms = getWindowLightUniforms(interpolateWindowPalette(chill, social, 0.5), 'far', true);
    expect(uniforms.litCode).toBe(255);
    expect(uniforms.win).toEqual([1, 0.85, 0.6]);
    expect(uniforms.hazeAlpha).toBe(0);
  });

  test.each(['raw', 'red', 'mask', 'ramp'] as const)('recognizes the %s diagnostic flag', (mode) => {
    expect(resolveLightsDebugMode(mode, false)).toBe(mode);
  });

  test('shows all-on mode when its legacy flag is set', () => {
    expect(resolveLightsDebugMode(undefined, true)).toBe('all');
  });

  test.each(['raw', 'red', 'mask', 'ramp', 'all'] as const)('labels the %s diagnostic on screen', (mode) => {
    expect(getLightsDebugBadgeLabel(mode)).toBe(`LIGHTS DEBUG: ${mode}`);
  });

  test.each(['raw', 'red', 'mask', 'ramp'] as const)('%s diagnostic targets only preview mid layer', (mode) => {
    expect(isLightsDebugTarget(mode, 'preview', 'mid')).toBe(true);
    expect(isLightsDebugTarget(mode, 'preview', 'far')).toBe(false);
    expect(isLightsDebugTarget(mode, 'hero', 'mid')).toBe(false);
  });
});
