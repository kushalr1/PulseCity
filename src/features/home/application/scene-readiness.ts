export function canRevealScene(required: readonly string[], loaded: ReadonlySet<string>) {
  return required.length > 0 && required.every((name) => loaded.has(name));
}

export function shouldRevealScene(isVisible: boolean, assetsReady: boolean) {
  return isVisible && assetsReady;
}
