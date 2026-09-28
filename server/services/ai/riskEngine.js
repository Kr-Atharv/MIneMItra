/**
 * Deterministic risk engine (server-side mirror).
 *
 * The frontend already computes riskScore/riskBand from the same formula
 * (src/lib/riskEngine.ts) and sends it as part of the mine profile. This
 * module recomputes it independently from the same inputs purely as a
 * sanity check / defence-in-depth — it never lets the LLM set or override
 * the number (spec Section 5).
 *
 * Step 2: widened to mirror the same additive/weighted signals the client
 * now sends (overdueActions, recurringViolations, expiredDocuments,
 * productionAnomalies, contractorPenalty) so the server-side sanity check
 * stays meaningful instead of flagging every widened score as a "mismatch".
 */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Kept identical to RISK_SIGNAL_WEIGHTS in src/lib/riskEngine.ts.
const WEIGHTS = {
  criticalViolation: { perUnit: 2, cap: 10 },
  overdueAction: { perUnit: 1.5, cap: 15 },
  recurringViolation: { perUnit: 1.2, cap: 12 },
  expiredDocument: { perUnit: 3, cap: 9 },
  productionAnomaly: { perUnit: 4, cap: 8 },
  contractorPenalty: { cap: 6 }
};

/**
 * Recompute a 0-99 risk score from the same primitive fields the frontend
 * uses, when compliance/audit figures are provided. Falls back to trusting
 * the client-supplied score if the primitives aren't present (e.g. for
 * subsidiary/org-level aggregates that are pre-averaged on the client).
 */
function recomputeScore(profile) {
  if (typeof profile.cmrComplianceRate !== 'number' || typeof profile.dgmsAuditScore !== 'number') {
    return typeof profile.riskScore === 'number' ? profile.riskScore : null;
  }

  const base = 100 - profile.cmrComplianceRate;
  const auditPenalty = (100 - profile.dgmsAuditScore) * 0.4;

  const criticalAdd = Math.min((profile.criticalViolations || 0) * WEIGHTS.criticalViolation.perUnit, WEIGHTS.criticalViolation.cap);
  const overdueAdd = Math.min((profile.overdueActions || 0) * WEIGHTS.overdueAction.perUnit, WEIGHTS.overdueAction.cap);
  const recurringAdd = Math.min((profile.recurringViolations || 0) * WEIGHTS.recurringViolation.perUnit, WEIGHTS.recurringViolation.cap);
  const expiredAdd = Math.min((profile.expiredDocuments || 0) * WEIGHTS.expiredDocument.perUnit, WEIGHTS.expiredDocument.cap);
  const productionAdd = Math.min((profile.productionAnomalies || 0) * WEIGHTS.productionAnomaly.perUnit, WEIGHTS.productionAnomaly.cap);
  const contractorAdd = Math.min(profile.contractorPenalty || 0, WEIGHTS.contractorPenalty.cap);

  return Math.round(clamp(base + auditPenalty + criticalAdd + overdueAdd + recurringAdd + expiredAdd + productionAdd + contractorAdd, 0, 99));
}

function bandFromScore(score) {
  if (score >= 76) return 'CRITICAL';
  if (score >= 51) return 'HIGH';
  if (score >= 26) return 'MODERATE';
  return 'LOW';
}

/**
 * Validates the client-reported score against the server recomputation.
 * Logs a warning on mismatch but never blocks the request — the platform's
 * displayed dashboards are the source of truth for the score; this is a
 * transparency/audit check only.
 */
function validateRiskScore(profile, logger = console) {
  const recomputed = recomputeScore(profile);
  if (recomputed !== null && typeof profile.riskScore === 'number' && Math.abs(recomputed - profile.riskScore) > 3) {
    logger.warn(
      `[riskEngine] Client-reported risk score (${profile.riskScore}) for "${profile.mine || 'unknown mine'}" differs from server recomputation (${recomputed}) by more than tolerance.`
    );
  }
  return recomputed;
}

/**
 * Simple deterministic anomaly rules (Section 11) — evaluated before the
 * LLM is asked to explain anything in natural language.
 */
function detectAnomalies(profile) {
  const anomalies = [];
  if (typeof profile.activeViolations === 'number' && profile.activeViolations >= 10) {
    anomalies.push(`Unusually high number of active violations (${profile.activeViolations}).`);
  }
  if (typeof profile.recentIncidents === 'number' && profile.recentIncidents >= 2) {
    anomalies.push(`Multiple recent safety incidents recorded (${profile.recentIncidents}).`);
  }
  if (typeof profile.overdueActions === 'number' && profile.overdueActions >= 5) {
    anomalies.push(`Significant corrective-action backlog (${profile.overdueActions} overdue).`);
  }
  if (typeof profile.expiredDocuments === 'number' && profile.expiredDocuments >= 1) {
    anomalies.push(`${profile.expiredDocuments} statutory document(s) currently expired.`);
  }
  if (typeof profile.productionAnomalies === 'number' && profile.productionAnomalies >= 1) {
    anomalies.push(`${profile.productionAnomalies} production/operations report(s) flagged with anomalies.`);
  }
  if (typeof profile.contractorPenalty === 'number' && profile.contractorPenalty >= 3) {
    anomalies.push('Active contractor/MDO violations are contributing meaningfully to this mine\'s risk.');
  }
  // Step 2: complianceHistory now carries a real recorded risk-score
  // time-series (see RISK_HISTORY in src/data/mockData.ts + mineProfile.ts),
  // not a fabricated compliance-percentage extrapolation. A rising risk
  // score across the recorded points is itself an anomaly worth flagging.
  if (Array.isArray(profile.complianceHistory) && profile.complianceHistory.length >= 2) {
    const first = profile.complianceHistory[0];
    const last = profile.complianceHistory[profile.complianceHistory.length - 1];
    if (last - first >= 8) {
      anomalies.push(`Recorded risk score climbed sharply from ${first} to ${last} over the observed period.`);
    }
  }
  return anomalies;
}

/**
 * Deterministic trend direction from a short numeric history (Section 10).
 */
function trendFromSeries(series, higherIsBetter = true) {
  if (!Array.isArray(series) || series.length < 2) return 'STABLE';
  const delta = series[series.length - 1] - series[0];
  const threshold = 2;
  if (Math.abs(delta) < threshold) return 'STABLE';
  if (higherIsBetter) return delta > 0 ? 'IMPROVING' : 'DECLINING';
  return delta > 0 ? 'INCREASING' : 'DECREASING';
}

/**
 * Step 2: "do not fabricate a confidence percentage that doesn't trace to
 * something real." Rather than trust whatever number the LLM happens to
 * return, we compute confidence purely from how many structured signals
 * were actually present in the profile sent to it — more real data behind
 * the analysis = higher confidence, regardless of what the model claims.
 * Callers should overwrite result.confidence with this value.
 */
const CONFIDENCE_SIGNAL_FIELDS = [
  'cmrComplianceRate',
  'dgmsAuditScore',
  'activeViolations',
  'criticalViolations',
  'recurringViolations',
  'overdueActions',
  'overdueInspections',
  'recentIncidents',
  'expiredDocuments',
  'productionAnomalies',
  'contractorPenalty'
];

function computeSignalConfidence(profile) {
  const present = CONFIDENCE_SIGNAL_FIELDS.filter((key) => typeof profile[key] === 'number').length;
  const historyBonus = Array.isArray(profile.complianceHistory) && profile.complianceHistory.length >= 4 ? 1 : 0;
  const totalPossible = CONFIDENCE_SIGNAL_FIELDS.length + 1;
  const ratio = (present + historyBonus) / totalPossible;
  // Floor at 0.3 (a mine profile always has at least compliance + audit
  // score) and cap at 0.95 (never claim total certainty from mock data).
  return Math.round(clamp(0.3 + ratio * 0.65, 0.3, 0.95) * 100) / 100;
}

module.exports = {
  recomputeScore,
  bandFromScore,
  validateRiskScore,
  detectAnomalies,
  trendFromSeries,
  computeSignalConfidence
};
