import type { WindowLightLayer } from '../window-light-assets';

export const calibrationRampRect = { x: 0, y: 0, width: 256, height: 16 } as const;

export function windowLightPlacement(
  geometry: WindowLightLayer,
  camera: number,
  scale: number,
  entrance = 1,
  entranceOffset = 0,
) {
  'worklet';
  const rise = 1 - (1 - entrance) ** 3;
  return {
    rect: { x: 0, y: 0, width: geometry.sizePt[0], height: geometry.sizePt[1] },
    translateX: -camera * geometry.parallax,
    translateY: geometry.offsetYPt + (1 - rise) * entranceOffset,
    scale,
  };
}
