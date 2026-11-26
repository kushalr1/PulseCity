export type SceneBounds = { x: number; y: number; width: number; height: number };

export function transitionBounds(from: SceneBounds, to: SceneBounds, progress: number): SceneBounds {
  'worklet';
  const t = Math.min(1, Math.max(0, progress));
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    width: from.width + (to.width - from.width) * t,
    height: from.height + (to.height - from.height) * t,
  };
}

export function cityWorldTransitionDuration(reducedMotion: boolean) {
  return reducedMotion ? 0 : 650;
}

export function startCityWorldTransition(
  bounds: SceneBounds | null,
  reducedMotion: boolean,
  begin: (bounds: SceneBounds) => void,
  navigate: () => void,
) {
  if (reducedMotion || !bounds || bounds.width <= 0 || bounds.height <= 0) {
    navigate();
    return;
  }
  begin(bounds);
  navigate();
}
