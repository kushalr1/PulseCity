export type DistanceSource = 'selected-area' | 'device';

export function formatDistanceLabel(distanceMeters: number, selectedArea: string, source: DistanceSource): string {
  const safeDistance = Math.max(0, distanceMeters);
  const distance = safeDistance < 1000
    ? `${Math.round(safeDistance / 10) * 10} m`
    : `${(safeDistance / 1000).toFixed(1)} km`;
  const origin = source === 'device' ? 'your location' : selectedArea;
  return `≈ ${distance} from ${origin}`;
}
