/** Validate WGS84 coordinates before placing a GIS marker. */
export function isValidGps(gps?: { lat?: number; lng?: number } | null): gps is { lat: number; lng: number } {
  if (!gps) return false;
  const { lat, lng } = gps;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return true;
}

/** Small deterministic offset so pins cluster on the recorded mine lease, not random India-wide scatter. */
export function offsetWithinMine(base: { lat: number; lng: number }, index: number): { lat: number; lng: number } {
  const lat = Number((base.lat + ((index % 6) - 2.5) * 0.0034).toFixed(6));
  const lng = Number((base.lng + ((Math.floor(index / 6) % 6) - 2.5) * 0.0034).toFixed(6));
  return { lat, lng };
}
