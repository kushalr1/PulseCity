// Grey threshold/coverage maps from pulsecity-window-lights-v2.2-gray.
export type WindowLightSurface = 'hero' | 'preview' | 'full';
export type WindowLightLayer = {
  thresholdSource: number;
  coverageSource: number;
  sizePt: readonly [number, number];
  offsetYPt: number;
  parallax: number;
  hazeTopPt?: number;
};

export const windowLightLayers: Record<WindowLightSurface, { far: WindowLightLayer; mid: WindowLightLayer }> = {
  hero: {
    far: { thresholdSource: require('../../../assets/images/scene/v2/window-lights/hero/hero_far_thr.png'), coverageSource: require('../../../assets/images/scene/v2/window-lights/hero/hero_far_cov.png'), sizePt: [431, 103], offsetYPt: 140, parallax: 0.3, hazeTopPt: 20.38 },
    mid: { thresholdSource: require('../../../assets/images/scene/v2/window-lights/hero/hero_mid_thr.png'), coverageSource: require('../../../assets/images/scene/v2/window-lights/hero/hero_mid_cov.png'), sizePt: [472, 101.667], offsetYPt: 141.333, parallax: 0.6 },
  },
  preview: {
    far: { thresholdSource: require('../../../assets/images/scene/v2/window-lights/preview/preview_far_thr.png'), coverageSource: require('../../../assets/images/scene/v2/window-lights/preview/preview_far_cov.png'), sizePt: [434, 103], offsetYPt: 105, parallax: 0.3, hazeTopPt: 23.96 },
    mid: { thresholdSource: require('../../../assets/images/scene/v2/window-lights/preview/preview_mid_thr.png'), coverageSource: require('../../../assets/images/scene/v2/window-lights/preview/preview_mid_cov.png'), sizePt: [509, 107], offsetYPt: 101, parallax: 0.6 },
  },
  full: {
    far: { thresholdSource: require('../../../assets/images/scene/v2/window-lights/full/full_far_thr.png'), coverageSource: require('../../../assets/images/scene/v2/window-lights/full/full_far_cov.png'), sizePt: [636, 291], offsetYPt: 411.667, parallax: 0.3, hazeTopPt: 44.0933 },
    mid: { thresholdSource: require('../../../assets/images/scene/v2/window-lights/full/full_mid_thr.png'), coverageSource: require('../../../assets/images/scene/v2/window-lights/full/full_mid_cov.png'), sizePt: [882, 348.333], offsetYPt: 354.333, parallax: 0.6 },
  },
};

export const calibrationRampSource = require('../../../assets/images/scene/v2/window-lights/calibration_ramp_256.png');
