// MineMitra — frontend client for Step 5 external data (weather / AQI /
// rulebook). Every call is routed through the same shared aiRequestQueue
// as aiClient.ts (Step 3), so opening several mine cards — or resolving
// several compliance items that each trigger a rulebook lookup — never
// bursts these free-tier APIs any more than it bursts the LLM.
//
// Consumers: Step 2's risk engine (Environment-pillar signal), Step 6's
// useMineLocation-driven widgets, and Step 7's CMRReferenceModal rework.

import { enqueueRequest } from './aiRequestQueue';
import { RATE_LIMIT_MESSAGE, isRateLimited } from './aiClient';

export { RATE_LIMIT_MESSAGE, isRateLimited };

export interface WeatherReading {
  temperatureC: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
  source: string;
  fetchedAt?: string;
  cached?: boolean;
  degraded?: boolean;
  errorCode?: string;
}

export interface AqiReading {
  aqi: number | null;
  pollutant: string | null;
  station?: string;
  source: string;
  fetchedAt?: string;
  cached?: boolean;
  degraded?: boolean;
  errorCode?: string;
  /** True when this reading came from a fallback location, not the exact
   * requested city (Step 6 — e.g. no station for the mine's own town, so
   * the subsidiary HQ city/state was used instead). */
  approximate?: boolean;
  matchedLocation?: string;
  requestedLocation?: string;
}

export interface RuleBookEntry {
  act: string;
  section: string;
  title?: string;
  summary: string;
  // 'live' = fetched from the third-party statute index just now.
  // 'local-index' / 'local-fallback' = served from statuteIndex.json
  // because the live source was unreachable or empty (spec Step 5c/7).
  source: 'live' | 'local-index' | 'local-fallback' | string;
  fallbackReason?: string;
}

export interface RuleBookSearchResponse {
  results: RuleBookEntry[];
  source: string;
  degraded?: boolean;
  errorCode?: string;
  cached?: boolean;
}

async function getJson<T>(url: string): Promise<T> {
  return enqueueRequest(async () => {
    const res = await fetch(url);
    // These routes always answer 200 with a degraded/errorCode payload on
    // failure (same contract as /api/ai/*) — a non-ok status here means
    // the request never even reached our own server.
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.json()) as T;
  });
}

export async function fetchMineWeather(lat: number, lon: number, forceRefresh = false): Promise<WeatherReading> {
  try {
    return await getJson<WeatherReading>(`/api/external/weather?lat=${lat}&lon=${lon}${forceRefresh ? '&forceRefresh=1' : ''}`);
  } catch {
    return { temperatureC: null, precipitationMm: null, windSpeedKmh: null, source: 'Open-Meteo', degraded: true, errorCode: 'network_error' };
  }
}

export async function fetchMineAqi(city: string, fallbacks: string[] = [], forceRefresh = false): Promise<AqiReading> {
  try {
    const params = new URLSearchParams({ city });
    if (fallbacks.length) params.set('fallbacks', fallbacks.join(','));
    if (forceRefresh) params.set('forceRefresh', '1');
    return await getJson<AqiReading>(`/api/external/aqi?${params.toString()}`);
  } catch {
    return { aqi: null, pollutant: null, station: city, source: 'unavailable', degraded: true, errorCode: 'network_error' };
  }
}

export async function searchRuleBook(query: string): Promise<RuleBookSearchResponse> {
  try {
    return await getJson<RuleBookSearchResponse>(`/api/external/rulebook/search?q=${encodeURIComponent(query)}`);
  } catch {
    return { results: [], source: 'unavailable', degraded: true, errorCode: 'network_error' };
  }
}

export async function fetchRuleBookSection(act: string, sectionNumber: string): Promise<RuleBookEntry & { degraded?: boolean; errorCode?: string }> {
  try {
    return await getJson(`/api/external/rulebook/section/${encodeURIComponent(act)}/${encodeURIComponent(sectionNumber)}`);
  } catch {
    return { act, section: sectionNumber, summary: '', source: 'unavailable', degraded: true, errorCode: 'network_error' };
  }
}
