/**
 * Minimal in-memory cache for AI analysis responses.
 * Keyed by a hash of the exact structured data sent to the model, so a
 * cache entry is naturally invalidated the moment the underlying data
 * changes (compliance %, violation counts, etc.) — no manual bookkeeping
 * needed. Entries also expire after TTL_MS as a backstop.
 */

const crypto = require('crypto');

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
// Step 3: mine-analysis gets a shorter, spec-mandated TTL (2-5 min) since
// it's opened/reopened per-mine far more often than the org-level summaries.
const NAMESPACE_TTL_MS = {
  'mine-analysis': 3 * 60 * 1000,
  // Step 5: weather/AQI don't change every second — a 5-10 min TTL is
  // plenty fresh for a compliance dashboard and keeps both free-tier APIs
  // well clear of their rate limits.
  weather: 7 * 60 * 1000,
  aqi: 7 * 60 * 1000,
  // Statute text is effectively static — cache generously so repeat
  // lookups of the same clause never hit the live source again.
  'rulebook-search': 30 * 60 * 1000,
  'rulebook-section': 30 * 60 * 1000
};
const store = new Map();

function ttlFor(namespace) {
  return NAMESPACE_TTL_MS[namespace] || DEFAULT_TTL_MS;
}

function keyFor(namespace, payload) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return `${namespace}:${hash}`;
}

function get(namespace, payload) {
  const key = keyFor(namespace, payload);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlFor(namespace)) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(namespace, payload, value) {
  const key = keyFor(namespace, payload);
  store.set(key, { value, timestamp: Date.now() });
}

module.exports = { get, set };
