import { useCallback, useEffect, useState } from 'react';
import { MINE_LOCATIONS, SUBSIDIARIES } from '../data/mockData';

export type LocationSourceLabel = 'Using device location' | 'Manually entered' | 'Default mine coordinates';

export interface MineLocationResult {
  lat: number | null;
  lng: number | null;
  /** Best-effort place name for AQI's city-keyed lookup (Step 5b). */
  city: string;
  /** Step 6 — broader locations to try for AQI if `city` has no monitoring
   * station: the mine's subsidiary HQ city, then that HQ's state. Always
   * geographically correct for the mine (not a hardcoded default). */
  aqiFallbacks: string[];
  /** Always set, so it's never ambiguous which source is actually active. */
  sourceLabel: LocationSourceLabel;
  isResolvingDevice: boolean;
  geolocationUnavailable: boolean;
  manualInput: string;
  setManualInput: (value: string) => void;
  applyManualInput: () => void;
  clearManualInput: () => void;
  retryDeviceLocation: () => void;
}

const COORD_PATTERN = /^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/;

/**
 * Step 6 — resolves a location for weather/AQI lookups with a strict
 * fallback order, and always reports which one is actually active:
 *
 *   1. navigator.geolocation.getCurrentPosition() — device GPS, subject to
 *      the browser's own permission prompt.
 *   2. A manual lat/lon (or mine/place name) typed by the user, if device
 *      location was denied/unavailable.
 *   3. The existing static MINE_LOCATIONS mapping for the given mineId, as
 *      the last resort if manual entry is also empty.
 */
export function useMineLocation(mineId: string): MineLocationResult {
  const [devicePosition, setDevicePosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geolocationUnavailable, setGeolocationUnavailable] = useState(false);
  const [isResolvingDevice, setIsResolvingDevice] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [manualLocation, setManualLocation] = useState<{ lat: number | null; lng: number | null; label: string } | null>(null);

  const retryDeviceLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeolocationUnavailable(true);
      setIsResolvingDevice(false);
      return;
    }
    setIsResolvingDevice(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDevicePosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeolocationUnavailable(false);
        setIsResolvingDevice(false);
      },
      () => {
        // Denied, timed out, or position unavailable — all fall through
        // to manual entry / static coordinates below.
        setGeolocationUnavailable(true);
        setIsResolvingDevice(false);
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    retryDeviceLocation();
    // Only re-request on mount; the user drives retries after that via
    // retryDeviceLocation() (exposed for a "Try device location again" button).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyManualInput = useCallback(() => {
    const raw = manualInput.trim();
    if (!raw) {
      setManualLocation(null);
      return;
    }
    const coordMatch = raw.match(COORD_PATTERN);
    if (coordMatch) {
      setManualLocation({ lat: Number(coordMatch[1]), lng: Number(coordMatch[2]), label: raw });
    } else {
      // A place/mine name — no geocoding available client-side, so this
      // drives the AQI "city" query directly; weather still needs
      // coordinates, so it falls back to the static mine location below.
      setManualLocation({ lat: null, lng: null, label: raw });
    }
  }, [manualInput]);

  const clearManualInput = useCallback(() => {
    setManualInput('');
    setManualLocation(null);
  }, []);

  const staticMine = MINE_LOCATIONS.find((m) => m.id === mineId);
  const staticCity = staticMine?.area || staticMine?.name || '';
  // Step 6 — subsidiary HQ ("City, State") gives a geographically correct
  // fallback chain for AQI when the mine's own town has no monitoring
  // station, instead of failing outright or showing an unrelated region.
  const subsidiaryHq = SUBSIDIARIES.find((s) => s.code === staticMine?.subsidiary)?.hq || '';
  const [hqCity, hqState] = subsidiaryHq.split(',').map((s) => s.trim()).filter(Boolean);
  const aqiFallbacks = [hqCity, hqState].filter((v): v is string => Boolean(v) && v !== staticCity);

  let result: Omit<MineLocationResult, 'isResolvingDevice' | 'geolocationUnavailable' | 'manualInput' | 'setManualInput' | 'applyManualInput' | 'clearManualInput' | 'retryDeviceLocation'>;

  if (devicePosition) {
    result = { lat: devicePosition.lat, lng: devicePosition.lng, city: staticCity, aqiFallbacks, sourceLabel: 'Using device location' };
  } else if (manualLocation) {
    const hasManualCoords = manualLocation.lat !== null && manualLocation.lng !== null;
    result = {
      lat: hasManualCoords ? manualLocation.lat : staticMine?.coordinates.lat ?? null,
      lng: hasManualCoords ? manualLocation.lng : staticMine?.coordinates.lng ?? null,
      city: hasManualCoords ? staticCity : manualLocation.label,
      aqiFallbacks: hasManualCoords ? aqiFallbacks : [],
      sourceLabel: 'Manually entered'
    };
  } else {
    result = { lat: staticMine?.coordinates.lat ?? null, lng: staticMine?.coordinates.lng ?? null, city: staticCity, aqiFallbacks, sourceLabel: 'Default mine coordinates' };
  }

  return {
    ...result,
    isResolvingDevice,
    geolocationUnavailable,
    manualInput,
    setManualInput,
    applyManualInput,
    clearManualInput,
    retryDeviceLocation
  };
}
