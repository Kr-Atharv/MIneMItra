/**
 * Structured-output validation (spec Section 7). We never forward
 * free-form or malformed AI output to the frontend — every field is
 * checked and coerced to a safe shape first.
 */

const RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
const PRIORITIES = ['ROUTINE', 'MONITOR', 'URGENT', 'IMMEDIATE'];
const TRENDS = ['IMPROVING', 'STABLE', 'INCREASING', 'DECREASING'];

const strArray = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 8) : []);

function fallbackMineAnalysis(reason) {
  return {
    riskLevel: 'MODERATE',
    summary: 'AI analysis temporarily unavailable. The deterministic risk score above remains accurate and is unaffected.',
    keyRiskFactors: [],
    recurringPatterns: [],
    anomalies: [],
    recommendedActions: [],
    priority: 'MONITOR',
    confidence: 0,
    degraded: true,
    degradedReason: reason || 'unknown'
  };
}

function validateMineAnalysis(raw) {
  if (!raw || typeof raw !== 'object') return fallbackMineAnalysis('empty_response');
  const riskLevel = RISK_LEVELS.includes(raw.riskLevel) ? raw.riskLevel : null;
  const priority = PRIORITIES.includes(raw.priority) ? raw.priority : 'MONITOR';
  if (!riskLevel || typeof raw.summary !== 'string') return fallbackMineAnalysis('schema_mismatch');
  return {
    riskLevel,
    summary: raw.summary.slice(0, 800),
    keyRiskFactors: strArray(raw.keyRiskFactors),
    recurringPatterns: strArray(raw.recurringPatterns),
    anomalies: strArray(raw.anomalies),
    recommendedActions: strArray(raw.recommendedActions),
    priority,
    confidence: typeof raw.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0.5,
    degraded: false
  };
}

function fallbackSubsidiary(reason) {
  return { items: [], degraded: true, degradedReason: reason || 'unknown' };
}

function validateSubsidiaryAnalysis(raw) {
  if (!raw || !Array.isArray(raw.items)) return fallbackSubsidiary();
  const items = raw.items
    .filter((i) => i && typeof i.subsidiary === 'string' && RISK_LEVELS.includes(i.riskLevel))
    .map((i) => ({
      subsidiary: i.subsidiary,
      riskLevel: i.riskLevel,
      trend: TRENDS.includes(i.trend) ? i.trend : 'STABLE',
      note: typeof i.note === 'string' ? i.note.slice(0, 300) : ''
    }));
  return { items, degraded: items.length === 0 };
}

function fallbackGovernanceSummary(reason) {
  return {
    headline: 'AI governance summary temporarily unavailable.',
    highlights: [],
    priority: 'MONITOR',
    degraded: true,
    degradedReason: reason || 'unknown'
  };
}

function validateGovernanceSummary(raw) {
  if (!raw || typeof raw.headline !== 'string') return fallbackGovernanceSummary();
  return {
    headline: raw.headline.slice(0, 300),
    highlights: strArray(raw.highlights),
    priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'MONITOR',
    degraded: false
  };
}

function fallbackAsk(reason) {
  return {
    answer:
      reason === 'RATE_LIMITED'
        ? 'This data source is briefly rate-limited — please try again in a few seconds.'
        : 'AI analysis temporarily unavailable. Please try again shortly, or review the relevant dashboard directly.',
    citedData: [],
    followUpSuggestions: [],
    degraded: true,
    degradedReason: reason || 'unknown'
  };
}

function validateAsk(raw) {
  if (!raw || typeof raw.answer !== 'string') return fallbackAsk();
  return {
    answer: raw.answer.slice(0, 1500),
    citedData: strArray(raw.citedData),
    followUpSuggestions: strArray(raw.followUpSuggestions),
    degraded: false
  };
}

module.exports = {
  validateMineAnalysis,
  validateSubsidiaryAnalysis,
  validateGovernanceSummary,
  validateAsk,
  fallbackMineAnalysis,
  fallbackSubsidiary,
  fallbackGovernanceSummary,
  fallbackAsk
};
