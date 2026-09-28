import React, { useEffect, useRef, useState } from 'react';
import { X, Sparkles, AlertTriangle, RefreshCcw, ShieldQuestion, ListChecks, TrendingUp, Database, Loader2, Clock, UserCheck } from 'lucide-react';
import { MineProfile, MineAiAnalysis, fetchMineAnalysis, isRateLimited, RATE_LIMIT_MESSAGE } from '../lib/aiClient';
import { useAiQueueLength } from '../lib/aiRequestQueue';
import { deterministicKeyFactors, deterministicTrendDirection } from '../lib/mineProfile';
import { riskBandTone, RiskBand } from '../lib/riskEngine';
import { useGovernance } from '../context/GovernanceContext';

interface AIAnalysisModalProps {
  profile: MineProfile;
  onClose: () => void;
}

const priorityTone: Record<string, string> = {
  IMMEDIATE: 'bg-red-600 text-white',
  URGENT: 'bg-amber-500 text-white',
  MONITOR: 'bg-blue-500 text-white',
  ROUTINE: 'bg-slate-400 text-white'
};

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ profile, onClose }) => {
  const { activeRoleProfile } = useGovernance();
  const [analysis, setAnalysis] = useState<MineAiAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLimitedNotice, setRateLimitedNotice] = useState(false);
  const analysisRef = useRef<MineAiAnalysis | null>(null);
  const queueLength = useAiQueueLength();

  const band = (profile.riskBand.charAt(0) + profile.riskBand.slice(1).toLowerCase()) as RiskBand;
  const tone = riskBandTone(band);
  const trendDir = deterministicTrendDirection(profile);

  const load = (forceRefresh = false) => {
    // Only show the full-screen spinner when we have nothing to show yet —
    // a rate-limited refresh should never blank out a result already on screen.
    setLoading(!analysisRef.current);
    fetchMineAnalysis(profile, forceRefresh)
      .then((result) => {
        if (isRateLimited(result.degradedReason) && analysisRef.current) {
          // Step 3/10: never let a rate-limited response overwrite a good
          // result already on screen — keep it and just flag it as stale.
          setRateLimitedNotice(true);
          return;
        }
        setRateLimitedNotice(isRateLimited(result.degradedReason));
        analysisRef.current = result;
        setAnalysis(result);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.mine]);

  // Step 2: human-in-the-loop review flag. The LLM never sets or sees
  // this — it's a local, officer-driven acknowledgement that a human has
  // read this AI analysis before acting on it, consistent with the
  // human-always-reviews-before-action principle used throughout the app.
  const markAsReviewed = () => {
    if (!analysis) return;
    const reviewed: MineAiAnalysis = { ...analysis, humanReviewed: true, reviewedBy: activeRoleProfile.name };
    analysisRef.current = reviewed;
    setAnalysis(reviewed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 py-3 bg-[#004D40] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">MineMitra AI — Full Risk Analysis</div>
              <div className="text-[10px] text-emerald-200 font-mono truncate">{profile.mine} • {profile.subsidiary}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Risk Score + Level */}
          <div className={`p-3 rounded-lg border ${tone.border} ${tone.bg} flex items-center justify-between`}>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Score</div>
              <div className="text-3xl font-extrabold text-slate-900">{profile.riskScore}<span className="text-sm text-slate-400"> /100</span></div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Level</div>
              <div className={`text-lg font-extrabold ${tone.text}`}>{band}</div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8 text-slate-400 text-xs space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{queueLength > 0 ? `Waiting for ${queueLength} other AI request${queueLength > 1 ? 's' : ''} ahead...` : "MineMitra AI is analyzing this mine's data..."}</span>
            </div>
          )}

          {!loading && analysis && (
            <>
              {rateLimitedNotice && (
                <div className="flex items-center space-x-2 p-2.5 rounded border border-amber-300 bg-amber-50 text-amber-800 text-[11px] font-semibold">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{RATE_LIMIT_MESSAGE}</span>
                </div>
              )}
              {analysis.degraded && !rateLimitedNotice && (
                <div className="flex items-center space-x-2 p-2.5 rounded border border-amber-300 bg-amber-50 text-amber-800 text-[11px] font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>AI analysis temporarily unavailable — the risk score above is unaffected and remains accurate.</span>
                </div>
              )}

              {/* Why this risk */}
              <div>
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <ShieldQuestion className="w-4 h-4 text-[#004D40]" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Why This Risk?</h4>
                </div>
                <p className="text-[12px] text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded p-3">{analysis.summary}</p>
              </div>

              {/* Key risk factors */}
              <div>
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <ListChecks className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Key Risk Factors — Point Breakdown</h4>
                </div>
                {analysis.keyRiskFactors.length > 0 ? (
                  <ul className="space-y-1">
                    {analysis.keyRiskFactors.map((f, i) => (
                      <li key={i} className="text-[12px] text-slate-700 flex items-start space-x-2">
                        <span className="w-4 shrink-0 text-slate-400 font-mono text-[11px]">{i + 1}.</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-1">
                    {deterministicKeyFactors(profile).map((f, i) => (
                      <li key={i} className="text-[12px] text-slate-700 flex items-center justify-between space-x-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5">
                        <span className="flex items-center space-x-2 min-w-0">
                          <span className="w-4 shrink-0 text-slate-400 font-mono text-[11px]">{i + 1}.</span>
                          <span className="truncate">{f.label}</span>
                        </span>
                        {f.points > 0 && (
                          <span className="shrink-0 font-mono font-bold text-[11px] text-amber-700">+{f.points % 1 === 0 ? f.points : f.points.toFixed(1)} pts</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Point values trace directly to the same weighted formula used for the Risk Score above — nothing here is a separate, unexplainable model.
                </p>
              </div>

              {analysis.recurringPatterns.length > 0 && (
                <div>
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <RefreshCcw className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Recurring Patterns</h4>
                  </div>
                  <ul className="space-y-1">
                    {analysis.recurringPatterns.map((p, i) => (
                      <li key={i} className="text-[12px] text-slate-700 flex items-start space-x-2">
                        <span className="text-slate-300 mt-0.5">•</span><span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.anomalies.length > 0 && (
                <div>
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Detected Anomalies</h4>
                  </div>
                  <ul className="space-y-1">
                    {analysis.anomalies.map((a, i) => (
                      <li key={i} className="text-[12px] text-red-700 flex items-start space-x-2 bg-red-50 border border-red-100 rounded p-2">
                        <span className="mt-0.5">⚠</span><span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Historical trend */}
              <div>
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <TrendingUp className="w-4 h-4 text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Historical Trend — Recorded Risk Score</h4>
                </div>
                <div className="text-[12px] text-slate-700 bg-slate-50 border border-slate-200 rounded p-2.5 font-mono">
                  Risk Score: {profile.complianceHistory.join(' → ')}
                  <span className={`ml-2 font-bold not-italic ${trendDir === 'up' ? 'text-red-600' : trendDir === 'down' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    ({trendDir === 'up' ? 'DECLINING' : trendDir === 'down' ? 'IMPROVING' : 'STABLE'})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">7 recorded monthly points (Mar–Sep 2026) — a real history, not a derived approximation.</p>
              </div>

              {/* AI Risk Projection */}
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">Trend-Based Risk Forecast (not a scientific ML prediction)</div>
                <p className="text-[12px] text-emerald-950">
                  {trendDir === 'up'
                    ? `If current violation and corrective-action trends continue, ${profile.mine} risk is likely to increase further.`
                    : trendDir === 'down'
                    ? `${profile.mine} shows an improving trend; continued corrective action closure should sustain this direction.`
                    : `${profile.mine} risk trend is currently stable based on available data.`}
                </p>
              </div>

              {/* Recommended actions */}
              <div>
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <ListChecks className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Recommended Actions</h4>
                </div>
                <ul className="space-y-1">
                  {(analysis.recommendedActions.length ? analysis.recommendedActions : ['Review this mine\'s open corrective actions and statutory documents directly.']).map((a, i) => (
                    <li key={i} className="text-[12px] text-slate-700 flex items-start space-x-2 bg-emerald-50/50 border border-emerald-100 rounded p-2">
                      <span className="text-emerald-600 mt-0.5">✓</span><span>{a}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${priorityTone[analysis.priority]}`}>{analysis.priority}</span>
                  <span className="text-[10px] text-slate-400 font-mono">AI confidence: {Math.round(analysis.confidence * 100)}% (based on structured signals present)</span>
                </div>
              </div>

              {/* Human-in-the-loop review */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${analysis.humanReviewed ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center space-x-2 min-w-0">
                  <UserCheck className={`w-4 h-4 shrink-0 ${analysis.humanReviewed ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <div className="min-w-0">
                    <div className={`text-[11px] font-bold ${analysis.humanReviewed ? 'text-emerald-800' : 'text-slate-600'}`}>
                      {analysis.humanReviewed ? 'Reviewed by a human officer' : 'Not yet reviewed by a human officer'}
                    </div>
                    {analysis.humanReviewed && analysis.reviewedBy && (
                      <div className="text-[10px] text-emerald-700 truncate">Marked reviewed by {analysis.reviewedBy}</div>
                    )}
                  </div>
                </div>
                {!analysis.humanReviewed && (
                  <button
                    onClick={markAsReviewed}
                    className="shrink-0 px-2.5 py-1 bg-[#0B6B4A] hover:bg-[#0B6B4A]/90 text-white text-[11px] font-bold rounded"
                  >
                    Mark as Reviewed
                  </button>
                )}
              </div>

              {/* Data transparency */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <Database className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Data Used</h4>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 font-mono">
                  <div>Compliance: {profile.cmrComplianceRate}%</div>
                  <div>DGMS Audit Score: {profile.dgmsAuditScore}</div>
                  <div>Active Violations: {profile.activeViolations}</div>
                  <div>Critical Violations: {profile.criticalViolations}</div>
                  <div>Recurring Violations: {profile.recurringViolations}</div>
                  <div>Overdue Actions: {profile.overdueActions}</div>
                  <div>Overdue Inspections: {profile.overdueInspections}</div>
                  <div>Recent Incidents: {profile.recentIncidents}</div>
                  <div>Expired Documents: {profile.expiredDocuments}</div>
                  <div>Docs Expiring Soon: {profile.expiringSoonDocuments}</div>
                  <div>Production Anomalies: {profile.productionAnomalies}</div>
                  <div>Contractor Penalty: +{profile.contractorPenalty % 1 === 0 ? profile.contractorPenalty : profile.contractorPenalty.toFixed(1)}</div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  <strong>Risk Score</strong> is calculated deterministically from the structured data above.{' '}
                  <strong>AI Analysis</strong> is MineMitra AI's interpretation of that already-calculated data — it does not change the score.
                </p>
              </div>

              <button
                onClick={() => load(true)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded flex items-center justify-center space-x-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Refresh AI Analysis</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
