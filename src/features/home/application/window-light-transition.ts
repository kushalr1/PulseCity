export type WindowPalette = {
  lit: number;
  win: readonly [number, number, number];
  haze: readonly [number, number, number];
  hazeAlpha: number;
};

const LIT_KNOTS = [0, 0.10, 0.12, 0.24, 0.38, 0.50, 0.58, 0.80, 1] as const;
const CODE_KNOTS = [0, 26, 31, 61, 97, 128, 148, 204, 255] as const;

export function litCodeForFraction(lit: number): number {
  'worklet';
  const value = Math.max(0, Math.min(1, lit));
  for (let index = 1; index < LIT_KNOTS.length; index += 1) {
    if (value <= LIT_KNOTS[index]) {
      const t = (value - LIT_KNOTS[index - 1]) / (LIT_KNOTS[index] - LIT_KNOTS[index - 1]);
      return CODE_KNOTS[index - 1] + (CODE_KNOTS[index] - CODE_KNOTS[index - 1]) * t;
    }
  }
  return 255;
}

export function isCalibrationRampColumnCorrect(column: number, sampledGrey: number): boolean {
  'worklet';
  return Math.abs(Math.round(sampledGrey) - Math.floor(column)) < 0.5;
}

export type NormalizedWindowPalette = {
  lit: number;
  win: [number, number, number];
  haze: [number, number, number];
  hazeAlpha: number;
};

export function getWindowLightUniforms(palette: NormalizedWindowPalette, layer: 'far' | 'mid', forceAllWindows = false) {
  'worklet';
  return {
    litCode: forceAllWindows ? 255 : litCodeForFraction(palette.lit),
    win: forceAllWindows ? [1, 0.85, 0.6] : palette.win,
    haze: palette.haze,
    hazeAlpha: forceAllWindows ? 0 : layer === 'far' ? palette.hazeAlpha : 0,
  };
}

export function interpolateWindowPalette(from: WindowPalette, to: WindowPalette, progress: number): NormalizedWindowPalette {
  'worklet';
  const t = Math.max(0, Math.min(1, progress));
  const mix = (left: number, right: number) => (left + (right - left) * t) / 255;
  return {
    lit: from.lit + (to.lit - from.lit) * t,
    win: [mix(from.win[0], to.win[0]), mix(from.win[1], to.win[1]), mix(from.win[2], to.win[2])],
    haze: [mix(from.haze[0], to.haze[0]), mix(from.haze[1], to.haze[1]), mix(from.haze[2], to.haze[2])],
    hazeAlpha: from.hazeAlpha + (to.hazeAlpha - from.hazeAlpha) * t,
  };
}

export function snapshotWindowPalette(from: WindowPalette, to: WindowPalette, progress: number): WindowPalette {
  'worklet';
  const current = interpolateWindowPalette(from, to, progress);
  return {
    lit: current.lit,
    win: current.win.map((channel) => channel * 255) as unknown as WindowPalette['win'],
    haze: current.haze.map((channel) => channel * 255) as unknown as WindowPalette['haze'],
    hazeAlpha: current.hazeAlpha,
  };
}

export type SceneTransitionFrame = {
  progress: number;
  baseOpacityB: number;
  palette: NormalizedWindowPalette;
  litCode: number;
};

export function sceneTransitionFrame(from: WindowPalette, to: WindowPalette, progress: number): SceneTransitionFrame {
  'worklet';
  const p = Math.max(0, Math.min(1, progress));
  const palette = interpolateWindowPalette(from, to, p);
  return { progress: p, baseOpacityB: p, palette, litCode: litCodeForFraction(palette.lit) };
}

export function isWindowThresholdLit(threshold: number, lit: number) {
  'worklet';
  return threshold < lit;
}
