export type MapsPlatform = 'ios' | 'android' | 'web';

export function hospitalDirectionsUrl(platform: MapsPlatform, directionsQuery: string) {
  const query = encodeURIComponent(directionsQuery);
  if (platform === 'ios') return `https://maps.apple.com/?daddr=${query}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}
