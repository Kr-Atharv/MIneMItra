const express = require('express');
const { callAI, isConfigured, providerName } = require('../services/ai/aiProvider');
const { buildMineAnalysisPrompt, buildSubsidiaryPrompt, buildGovernanceSummaryPrompt, buildAskPrompt } = require('../services/ai/promptBuilder');
const { validateRiskScore, detectAnomalies, computeSignalConfidence } = require('../services/ai/riskEngine');
const {
  validateMineAnalysis,
  validateSubsidiaryAnalysis,
  validateGovernanceSummary,
  validateAsk,
  fallbackMineAnalysis,
  fallbackSubsidiary,
  fallbackGovernanceSummary,
  fallbackAsk
} = require('../services/ai/validate');
const cache = require('../services/ai/cache');

const router = express.Router();

// Simple structural guard so malformed/oversized bodies never reach the LLM.
const MAX_ARRAY_ITEMS = 60;

router.get('/health', async (req, res) => {
  const configured = isConfigured();
  if (req.query.live !== '1' || !configured) {
    return res.json({ ok: true, aiConfigured: configured, provider: providerName() });
  }
  // ?live=1 makes one real call so you can see the *actual* upstream
  // status (bad key / rate limit / decommissioned model) instead of just
  // "configured: true". Check the server terminal for the detailed reason.
  try {
    await callAI([{ role: 'user', content: 'Reply with {"ok":true} only.' }], { maxRetries: 0 });
    res.json({ ok: true, aiConfigured: true, provider: providerName(), liveCheck: 'passed' });
  } catch (err) {
    res.json({ ok: true, aiConfigured: true, provider: providerName(), liveCheck: 'failed', errorCode: err.code || 'unknown', errorMessage: err.message });
  }
});

router.post('/mine-analysis', async (req, res) => {
  const { mineProfile, forceRefresh } = req.body || {};
  if (!mineProfile || typeof mineProfile !== 'object' || typeof mineProfile.mine !== 'string') {
    return res.status(400).json({ error: 'mineProfile with a "mine" name is required.' });
  }

  validateRiskScore(mineProfile);
  const anomalies = detectAnomalies(mineProfile);
  const enrichedProfile = { ...mineProfile, ruleDetectedAnomalies: anomalies };

  if (!forceRefresh) {
    const cached = cache.get('mine-analysis', enrichedProfile);
    if (cached) return res.json({ ...cached, cached: true });
  }

  if (!isConfigured()) {
    return res.json(fallbackMineAnalysis('ai_not_configured'));
  }

  try {
    const messages = buildMineAnalysisPrompt(enrichedProfile);
    const raw = await callAI(messages);
    const result = validateMineAnalysis(raw);
    // Step 2: never trust the LLM's self-reported confidence — replace it
    // with a number that traces to how much structured data actually fed
    // this analysis, so "confidence" means something real.
    if (!result.degraded) {
      result.confidence = computeSignalConfidence(enrichedProfile);
      cache.set('mine-analysis', enrichedProfile, result);
    }
    res.json(result);
  } catch (err) {
    console.error('[ai/mine-analysis]', err.code || err.message);
    res.json(fallbackMineAnalysis(err.code || 'upstream_error'));
  }
});

router.post('/subsidiary-analysis', async (req, res) => {
  const { subsidiaryProfiles, forceRefresh } = req.body || {};
  if (!Array.isArray(subsidiaryProfiles) || subsidiaryProfiles.length === 0) {
    return res.status(400).json({ error: 'subsidiaryProfiles array is required.' });
  }
  const trimmed = subsidiaryProfiles.slice(0, MAX_ARRAY_ITEMS);

  if (!forceRefresh) {
    const cached = cache.get('subsidiary-analysis', trimmed);
    if (cached) return res.json({ ...cached, cached: true });
  }

  if (!isConfigured()) return res.json(fallbackSubsidiary('ai_not_configured'));

  try {
    const messages = buildSubsidiaryPrompt(trimmed);
    const raw = await callAI(messages);
    const result = validateSubsidiaryAnalysis(raw);
    if (!result.degraded) cache.set('subsidiary-analysis', trimmed, result);
    res.json(result);
  } catch (err) {
    console.error('[ai/subsidiary-analysis]', err.code || err.message);
    res.json(fallbackSubsidiary(err.code || 'upstream_error'));
  }
});

router.post('/governance-summary', async (req, res) => {
  const { orgProfile, forceRefresh } = req.body || {};
  if (!orgProfile || typeof orgProfile !== 'object') {
    return res.status(400).json({ error: 'orgProfile is required.' });
  }

  if (!forceRefresh) {
    const cached = cache.get('governance-summary', orgProfile);
    if (cached) return res.json({ ...cached, cached: true });
  }

  if (!isConfigured()) return res.json(fallbackGovernanceSummary('ai_not_configured'));

  try {
    const messages = buildGovernanceSummaryPrompt(orgProfile);
    const raw = await callAI(messages);
    const result = validateGovernanceSummary(raw);
    if (!result.degraded) cache.set('governance-summary', orgProfile, result);
    res.json(result);
  } catch (err) {
    console.error('[ai/governance-summary]', err.code || err.message);
    res.json(fallbackGovernanceSummary(err.code || 'upstream_error'));
  }
});

router.post('/ask', async (req, res) => {
  const { question, context, roleLabel } = req.body || {};
  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question is required.' });
  }
  if (question.length > 500) {
    return res.status(400).json({ error: 'question is too long.' });
  }
  if (!context || typeof context !== 'object') {
    return res.status(400).json({ error: 'context is required (only the data the current role may see).' });
  }

  if (!isConfigured()) return res.json(fallbackAsk('ai_not_configured'));

  try {
    const messages = buildAskPrompt(question.trim(), context, roleLabel || 'Officer');
    const raw = await callAI(messages, { temperature: 0.3 });
    const result = validateAsk(raw);
    res.json(result);
  } catch (err) {
    console.error('[ai/ask]', err.code || err.message);
    res.json(fallbackAsk(err.code || 'upstream_error'));
  }
});

module.exports = router;
