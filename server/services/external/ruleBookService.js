/**
 * MineMitra external data — statute/clause lookup (Step 5c).
 *
 * LABELING (important, per spec): indiacode.nic.in — the actual Government
 * of India statute repository — does not publish a documented public API.
 * The endpoint below is a third-party mirror of the official text, not an
 * official government API. Never present it as one in UI copy; always
 * describe results as "cross-referenced against a structured statute-text
 * index".
 *
 * RELIABILITY: so the demo never depends on a live third-party call at
 * judge time, the four acts named in the spec (Mines Act 1952, Coal Mines
 * Regulations 2017, Environment Protection Act 1986, Contract Labour Act
 * 1970) are cached locally in statuteIndex.json and used automatically
 * whenever the live call fails, times out, or returns nothing.
 */

const fs = require('fs');
const path = require('path');
const cache = require('../ai/cache');

const SEARCH_ENDPOINT = 'https://indiacode.ecourtsindia.com/api/v1/search';
const SECTION_ENDPOINT_BASE = 'https://indiacode.ecourtsindia.com/api/v1';
const REQUEST_TIMEOUT_MS = 8000;
const MAX_BACKOFF_MS = 6000;
const BASE_BACKOFF_MS = 1000;

let localIndexCache = null;
function loadLocalIndex() {
  if (!localIndexCache) {
    const raw = fs.readFileSync(path.join(__dirname, 'statuteIndex.json'), 'utf8');
    localIndexCache = JSON.parse(raw);
  }
  return localIndexCache;
}

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
        const err = new Error(`Rulebook upstream responded with ${response.status}`);
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

function searchLocalIndex(query) {
  const q = query.toLowerCase();
  return loadLocalIndex()
    .filter(
      (entry) =>
        entry.act.toLowerCase().includes(q) ||
        entry.section.toLowerCase().includes(q) ||
        entry.title.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q)
    )
    .map((entry) => ({ ...entry, source: 'local-index' }));
}

/**
 * @param {string} query
 * @param {{forceRefresh?:boolean}} [options]
 */
async function searchRuleBook(query, { forceRefresh = false } = {}) {
  if (!query || typeof query !== 'string') {
    const err = new Error('query is required.');
    err.code = 'INVALID_QUERY';
    throw err;
  }

  const cacheKey = { query: query.toLowerCase() };
  if (!forceRefresh) {
    const cached = cache.get('rulebook-search', cacheKey);
    if (cached) return { ...cached, cached: true };
  }

  try {
    const url = `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`;
    const data = await fetchJsonWithRetry(url);
    const results = Array.isArray(data?.results) ? data.results.slice(0, 20) : [];
    if (results.length === 0) {
      const err = new Error('Live rulebook search returned no results.');
      err.code = 'NO_MATCH';
      throw err;
    }
    const result = { results, source: 'live', fetchedAt: new Date().toISOString() };
    cache.set('rulebook-search', cacheKey, result);
    return { ...result, cached: false };
  } catch (err) {
    if (err.code === 'RATE_LIMITED') throw err;
    // Live source unreachable / empty — fall back to the local snapshot so
    // "Matched regulation" never renders blank at demo time (spec Step 7).
    const results = searchLocalIndex(query);
    return {
      results,
      source: 'local-fallback',
      fallbackReason: err.code || 'upstream_error',
      fetchedAt: new Date().toISOString(),
      cached: false
    };
  }
}

/**
 * @param {string} act
 * @param {string|number} number
 */
async function getSection(act, number) {
  if (!act || !number) {
    const err = new Error('act and number are required.');
    err.code = 'INVALID_QUERY';
    throw err;
  }

  const cacheKey = { act: act.toLowerCase(), number: String(number) };
  const cached = cache.get('rulebook-section', cacheKey);
  if (cached) return { ...cached, cached: true };

  try {
    const url = `${SECTION_ENDPOINT_BASE}/${encodeURIComponent(act)}/section/${encodeURIComponent(number)}`;
    const data = await fetchJsonWithRetry(url);
    if (!data || !data.text) {
      const err = new Error('Live section lookup returned no text.');
      err.code = 'NO_MATCH';
      throw err;
    }
    const result = {
      act,
      section: String(number),
      title: data.title || '',
      summary: data.text,
      source: 'live',
      fetchedAt: new Date().toISOString()
    };
    cache.set('rulebook-section', cacheKey, result);
    return { ...result, cached: false };
  } catch (err) {
    if (err.code === 'RATE_LIMITED') throw err;
    const local = loadLocalIndex().find(
      (entry) => entry.act.toLowerCase() === act.toLowerCase() && entry.section.toLowerCase() === String(number).toLowerCase()
    );
    if (!local) {
      const notFound = new Error(`No section "${number}" found for "${act}" in the live source or local index.`);
      notFound.code = 'NO_MATCH';
      throw notFound;
    }
    return {
      ...local,
      source: 'local-fallback',
      fallbackReason: err.code || 'upstream_error',
      fetchedAt: new Date().toISOString(),
      cached: false
    };
  }
}

module.exports = { searchRuleBook, getSection };
