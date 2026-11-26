export function isSurfaceVisible(scrollTop: number, viewportHeight: number, surfaceTop: number, surfaceHeight: number) {
  'worklet';
  const scrollBottom = scrollTop + viewportHeight;
  return surfaceHeight > 0 && surfaceTop < scrollBottom && surfaceTop + surfaceHeight > scrollTop;
}
