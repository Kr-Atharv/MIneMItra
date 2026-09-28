/**
 * MineMitra external data — Air Quality Index (Step 5b).
 *
 * Primary: data.gov.in's CPCB real-time AQI resource. Needs a free key —
 * see AQI_DATA_GOV_API_KEY in .env.example for where to get one.
 * Fallback: WAQI (aqicn.org), used automatically whenever the primary call
 * fails, returns no matching station, or AQI_DATA_GOV_API_KEY is unset —
 * so one missing/expired key never takes AQI data down completely.
 *
 * Same backoff/cache contract as groqService.js / weatherService.js
 * (Step 3/10): 429s back off (Retry-After or exponential, capped at 6s)
 * and results are cached server-side for 5-10 min so repeat lookups for
 * the same mine/city don't re-call either upstream.
 */

const cache = require('../ai/cache');

const CPCB_RESOURCE_ID = '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';
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

function isCpcbConfigured() {
  return Boolean(process.env.AQI_DATA_GOV_API_KEY);
}

function isWaqiConfigured() {
  return Boolean(resolveWaqiToken());
}

/**
 * Defensively unwraps a common .env mistake: pasting the whole WAQI
 * feed URL (e.g. "http://api.waqi.info/feed/shanghai/?token=demo")
 * into WAQI_TOKEN instead of just the token itself. If a `token=`
 * query param is present anywhere in the value, that's used; otherwise
 * the raw value is trusted as-is.
 */
function resolveWaqiToken() {
  const raw = process.env.WAQI_TOKEN;
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/[?&]token=([^&\s]+)/);
  return match ? decodeURIComponent(match[1]) : trimmed;
}

async function fetchJsonWithRetry(url, { maxRetries = 1 } = {}) {
  let lastError;
  let retryDelayMs = 0;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (retryDelayMs > 0) await sleep(retryDelayMs);
    retryDelayMs = 0;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) {
        const err = new Error(`AQI upstream responded with ${response.status}`);
        err.code = response.status === 429 ? 'RATE_LIMITED' : 'EXTERNAL_UPSTREAM_ERROR';
        err.status = response.status;
        if (response.status === 429) retryDelayMs = backoffDelayMs(attempt, response.headers.get('retry-after'));
        throw err;
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (!err.code) err.code = err.name === 'AbortError' ? 'EXTERNAL_TIMEOUT' : 'EXTERNAL_NETWORK_ERROR';
      if (err.code !== 'RATE_LIMITED') break;
    }
  }
  throw lastError;
}

async function fetchFromCpcb(city) {
  if (!isCpcbConfigured()) {
    const err = new Error('AQI_DATA_GOV_API_KEY is not configured.');
    err.code = 'NOT_CONFIGURED';
    throw err;
  }
  const url = `https://api.data.gov.in/resource/${CPCB_RESOURCE_ID}?api-key=${process.env.AQI_DATA_GOV_API_KEY}&format=json&limit=50`;
  const data = await fetchJsonWithRetry(url);
  const records = Array.isArray(data?.records) ? data.records : [];
  const needle = city.toLowerCase();
  const match =
    records.find((r) => typeof r.city === 'string' && r.city.toLowerCase().includes(needle)) ||
    records.find((r) => typeof r.state === 'string' && r.state.toLowerCase().includes(needle));
  if (!match) {
    const err = new Error(`No CPCB station record matched "${city}".`);
    err.code = 'NO_MATCH';
    throw err;
  }
  const value = Number(match.pollutant_avg ?? match.avg_value);
  return {
    aqi: Number.isFinite(value) ? value : null,
    pollutant: match.pollutant_id || 'N/A',
    station: match.station || match.city,
    source: 'CPCB (data.gov.in)',
    fetchedAt: new Date().toISOString()
  };
}

async function fetchFromWaqi(city) {
  const token = resolveWaqiToken();
  if (!token) {
    const err = new Error('WAQI_TOKEN is not configured.');
    err.code = 'NOT_CONFIGURED';
    throw err;
  }
  const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${token}`;
  const data = await fetchJsonWithRetry(url);
  if (data?.status !== 'ok' || !data?.data) {
    const err = new Error(`WAQI had no data for "${city}".`);
    err.code = 'NO_MATCH';
    throw err;
  }
  const stationName = data.data.city?.name || city;

  // WAQI's public "demo" token is hardcoded server-side (by WAQI, not us)
  // to always return Shanghai's live feed, regardless of the city path in
  // the URL — it is a sample-response token, not a real (if rate-limited)
  // account. Silently accepting that would show Shanghai's AQI mislabeled
  // as whatever Indian city/mine was actually requested. Detect the one
  // reliable signal we have (the response station name doesn't mention
  // the requested city at all) and refuse it instead, so the caller falls
  // through to the next candidate / a clearly-labeled "unavailable" state
  // rather than a confidently wrong number. This only fires for the shared
  // "demo" token — a real WAQI token legitimately may return a nearby
  // station with a different name and should not be second-guessed here.
  if (token === 'demo' && !stationName.toLowerCase().includes(city.toLowerCase())) {
    const err = new Error(
      `WAQI's shared "demo" token only serves Shanghai sample data and cannot answer for "${city}". Get a free real token at https://aqicn.org/data-platform/token/ and set WAQI_TOKEN in .env.`
    );
    err.code = 'DEMO_TOKEN_UNUSABLE';
    throw err;
  }

  return {
    aqi: typeof data.data.aqi === 'number' ? data.data.aqi : null,
    pollutant: data.data.dominentpol || 'N/A',
    station: stationName,
    source: 'WAQI',
    fetchedAt: new Date().toISOString()
  };
}

/**
 * Tries CPCB then WAQI for a single location string, exactly like before.
 * Split out of fetchAqi so the fallback chain below can call it once per
 * candidate location.
 */
async function fetchOneLocation(location) {
  try {
    return await fetchFromCpcb(location);
  } catch (primaryErr) {
    if (primaryErr.code === 'RATE_LIMITED') throw primaryErr;
    try {
      return await fetchFromWaqi(location);
    } catch (fallbackErr) {
      if (fallbackErr.code === 'RATE_LIMITED') throw fallbackErr;
      const bothUnconfigured = primaryErr.code === 'NOT_CONFIGURED' && fallbackErr.code === 'NOT_CONFIGURED';
      const err = new Error(bothUnconfigured ? 'Neither AQI_DATA_GOV_API_KEY nor WAQI_TOKEN is configured.' : fallbackErr.message);
      err.code = bothUnconfigured ? 'NOT_CONFIGURED' : fallbackErr.code;
      throw err;
    }
  }
}

/**
 * @param {string} city
 * @param {{forceRefresh?:boolean, fallbacks?:string[]}} [options]
 *
 * `fallbacks` is an ordered list of broader locations to try if the exact
 * `city` has no station on either provider (e.g. the mine's subsidiary HQ
 * city, then that HQ's state) — so a mine in a town with no monitoring
 * station still shows the closest *correct* regional reading instead of
 * nothing at all. The response is tagged `approximate: true` and carries
 * `matchedLocation`/`requestedLocation` whenever a fallback (not the
 * original city) is what actually produced data, so the UI never shows an
 * approximate reading as if it were exact.
 */
async function fetchAqi(city, { forceRefresh = false, fallbacks = [] } = {}) {
  if (!city || typeof city !== 'string') {
    const err = new Error('city is required.');
    err.code = 'INVALID_LOCATION';
    throw err;
  }

  const candidates = [city, ...fallbacks]
    .map((c) => (typeof c === 'string' ? c.trim() : ''))
    .filter((c, idx, arr) => c && arr.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === idx);

  const cacheKey = { city: city.toLowerCase(), fallbacks: candidates.slice(1).map((c) => c.toLowerCase()) };
  if (!forceRefresh) {
    const cached = cache.get('aqi', cacheKey);
    if (cached) return { ...cached, cached: true };
  }

  let result;
  let lastErr;
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      result = await fetchOneLocation(candidates[i]);
      result.matchedLocation = candidates[i];
      result.requestedLocation = city;
      result.approximate = i > 0;
      break;
    } catch (err) {
      // A live rate-limit is a queue/backoff concern, not a "try the next
      // candidate" concern — stop and surface it as-is.
      if (err.code === 'RATE_LIMITED') throw err;
      lastErr = err;
    }
  }

  if (!result) throw lastErr;

  cache.set('aqi', cacheKey, result);
  return { ...result, cached: false };
}

module.exports = { fetchAqi, isCpcbConfigured, isWaqiConfigured };
