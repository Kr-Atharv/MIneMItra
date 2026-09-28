/**
 * MineMitra external data — weather (Step 5a).
 *
 * Open-Meteo (https://open-meteo.com/en/docs) is genuinely free and
 * keyless for non-commercial use — no signup, no API key, nothing to put
 * in .env. It's used here purely for a current-conditions snapshot per
 * mine (temperature / precipitation / wind), which Step 2's risk engine
 * can use as a small tagged Environment-pillar signal (e.g. heavy rainfall
 * forecast nudging risk up) once that step is wired in.
 *
 * Same backoff/cache contract as server/services/ai/groqService.js
 * (Step 3/10): 429s get Retry-After-or-exponential backoff capped at 6s,
 * and responses are cached server-side so re-opening the same mine's
 * weather doesn't re-call the API at all.
 */

const cache = require('../ai/cache');

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10000;
const MAX_BACKOFF_MS = 6000;
const BASE_BACKOFF_MS = 1000;

function backoffDelayMs(attempt, retryAfterHeader) {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (!Number.isNaN(seconds) && seconds >= 0) return Math.min(seconds * 1000, MAX_BACKOFF_MS);
  }
  return Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {{lat:number, lon:number}} location
 * @param {{forceRefresh?:boolean, maxRetries?:number}} [options]
 */
async function fetchWeather({ lat, lon }, { forceRefresh = false, maxRetries = 1 } = {}) {
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    const err = new Error('lat/lon are required numeric coordinates.');
    err.code = 'INVALID_LOCATION';
    throw err;
  }

  // Round to ~110m precision so nearby cache lookups for the same mine hit
  // even if the caller's coordinates carry extra float noise.
  const cacheKey = { lat: Math.round(lat * 1000) / 1000, lon: Math.round(lon * 1000) / 1000 };
  if (!forceRefresh) {
    const cached = cache.get('weather', cacheKey);
    if (cached) return { ...cached, cached: true };
  }

  let lastError;
  let retryDelayMs = 0;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (retryDelayMs > 0) await sleep(retryDelayMs);
    retryDelayMs = 0;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const url = `${ENDPOINT}?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const err = new Error(`Open-Meteo responded with ${response.status}`);
        err.code = response.status === 429 ? 'RATE_LIMITED' : 'EXTERNAL_UPSTREAM_ERROR';
        err.status = response.status;
        if (response.status === 429) retryDelayMs = backoffDelayMs(attempt, response.headers.get('retry-after'));
        throw err;
      }

      const data = await response.json();
      const result = {
        temperatureC: typeof data?.current?.temperature_2m === 'number' ? data.current.temperature_2m : null,
        precipitationMm: typeof data?.current?.precipitation === 'number' ? data.current.precipitation : null,
        windSpeedKmh: typeof data?.current?.wind_speed_10m === 'number' ? data.current.wind_speed_10m : null,
        source: 'Open-Meteo',
        fetchedAt: new Date().toISOString()
      };
      cache.set('weather', cacheKey, result);
      return { ...result, cached: false };
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (!err.code) err.code = err.name === 'AbortError' ? 'EXTERNAL_TIMEOUT' : 'EXTERNAL_NETWORK_ERROR';
      // Only worth retrying a rate limit — anything else won't be fixed by
      // trying again immediately.
      if (err.code !== 'RATE_LIMITED') break;
    }
  }
  throw lastError;
}

module.exports = { fetchWeather };
