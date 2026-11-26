export type SceneTransitionRole = 'incoming' | 'outgoing' | 'steady';

export function sceneOpacityForProgress(role: SceneTransitionRole, progress: number, initialOpacity?: number) {
  'worklet';
  const p = Math.max(0, Math.min(1, progress));
  if (role === 'incoming') { const initial = initialOpacity ?? 0; return initial + (1 - initial) * p; }
  if (role === 'outgoing') return (initialOpacity ?? 1) * (1 - p);
  return initialOpacity ?? 1;
}
