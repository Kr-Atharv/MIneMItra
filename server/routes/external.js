/**
 * MineMitra external data routes (Step 5) — weather, AQI, and statute
 * lookup. Mirrors routes/ai.js's contract exactly: every route always
 * answers 200 with a `degraded`/`errorCode` payload on failure (never a
 * raw non-2xx status or a blank body), so the frontend has one consistent
 * shape to render regardless of *why* an upstream failed.
 */

const express = require('express');
const { fetchWeather } = require('../services/external/weatherService');
const { fetchAqi } = require('../services/external/aqiService');
const { searchRuleBook, getSection } = require('../services/external/ruleBookService');

const router = express.Router();

function degradedResponse(res, err, fallbackPayload) {
  const errorCode = err.code || 'EXTERNAL_ERROR';
  console.error('[external]', errorCode, err.message);
  res.json({ ...fallbackPayload, degraded: true, errorCode });
}

router.get('/weather', async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon query params are required.' });
  }
  try {
    const result = await fetchWeather({ lat, lon }, { forceRefresh: req.query.forceRefresh === '1' });
    res.json(result);
  } catch (err) {
    degradedResponse(res, err, { temperatureC: null, precipitationMm: null, windSpeedKmh: null, source: 'Open-Meteo' });
  }
});

router.get('/aqi', async (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
  if (!city) return res.status(400).json({ error: 'city query param is required.' });
  const fallbacks =
    typeof req.query.fallbacks === 'string'
      ? req.query.fallbacks.split(',').map((c) => c.trim()).filter(Boolean)
      : [];
  try {
    const result = await fetchAqi(city, { forceRefresh: req.query.forceRefresh === '1', fallbacks });
    res.json(result);
  } catch (err) {
    degradedResponse(res, err, { aqi: null, pollutant: null, station: city, source: 'unavailable' });
  }
});

router.get('/rulebook/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) return res.status(400).json({ error: 'q query param is required.' });
  try {
    const result = await searchRuleBook(q, { forceRefresh: req.query.forceRefresh === '1' });
    res.json(result);
  } catch (err) {
    degradedResponse(res, err, { results: [], source: 'unavailable' });
  }
});

router.get('/rulebook/section/:act/:number', async (req, res) => {
  try {
    const result = await getSection(req.params.act, req.params.number);
    res.json(result);
  } catch (err) {
    degradedResponse(res, err, { act: req.params.act, section: req.params.number, summary: '', source: 'unavailable' });
  }
});

module.exports = router;
