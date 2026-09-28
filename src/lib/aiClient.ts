// MineMitra AI — frontend client.
// Every call here hits our OWN backend (server/routes/ai.js), which is the
// only thing that ever holds the Groq API key. No secret exists in this
// file or anywhere else in the bundle shipped to the browser.
//
// Step 3: every request below is routed through the shared aiRequestQueue
// so this file (plus the Step 5 weather/AQI/rulebook clients) never bursts
// past the upstream's free-tier rate limit, no matter how many components
// call in at once.

import { enqueueRequest } from './aiRequestQueue';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Priority = 'ROUTINE' | 'MONITOR' | 'URGENT' | 'IMMEDIATE';
export type Trend = 'IMPROVING' | 'STABLE' | 'INCREASING' | 'DECREASING';

export interface MineProfile {
  mine: string;
  subsidiary: string;
  cmrComplianceRate: number;
  dgmsAuditScore: number;
  riskScore: number;
  riskBand: string;
  activeViolations: number;
  criticalViolations: number;
  recurringViolations: number;
  overdueActions: number;
  overdueInspections: number;
  recentIncidents: number;
  expiredDocuments: number;
  expiringSoonDocuments: number;
  /** Step 2 (Step 1a signal): production/ops reports flagged with anomalies for this mine. */
  productionAnomalies: number;
  /** Step 2 (Step 1e signal): pre-capped 0-6 addend from active contractor/MDO violations at this mine. */
  contractorPenalty: number;
  /** Real recorded risk-score history (RISK_HISTORY), higher = riskier — see mineProfile.ts. */
  complianceHistory: number[];
}

export interface MineAiAnalysis {
  riskLevel: RiskLevel;
  summary: string;
  keyRiskFactors: string[];
  recurringPatterns: string[];
  anomalies: string[];
  recommendedActions: string[];
  priority: Priority;
  confidence: number;
  degraded: boolean;
  degradedReason?: string;
  cached?: boolean;
  /** Step 2: human-in-the-loop review flag — the LLM never sets this; it's
   * only flipped locally when an officer clicks "Mark as Reviewed". */
  humanReviewed?: boolean;
  reviewedBy?: string;
}

export interface SubsidiaryProfile {
  subsidiary: string;
  mineCount: number;
  compliance: number;
  risk: number;
  activeViolations: number;
  complianceTrend: number[];
}

export interface SubsidiaryAiItem {
  subsidiary: string;
  riskLevel: RiskLevel;
  trend: Trend;
  note: string;
}

export interface OrgProfile {
  totalMines: number;
  totalSubsidiaries: number;
  overallCompliance: number;
  criticalRiskMines: number;
  risingRiskMines: number;
  recurringViolations: number;
  significantlyOverdueActions: number;
  criticalProjectionMines: number;
}

export interface GovernanceAiSummary {
  headline: string;
  highlights: string[];
  priority: Priority;
  degraded: boolean;
  degradedReason?: string;
}

export interface AskAiResult {
  answer: string;
  citedData: string[];
  followUpSuggestions: string[];
  degraded: boolean;
  degradedReason?: string;
}

// Shared across every AI/external-data surface (Step 3 + Step 10) so a
// rate-limited call always reads the same, honest way to the user instead
// of a generic/blank failure.
export const RATE_LIMIT_MESSAGE = 'This data source is briefly rate-limited — showing last cached result.';

export const isRateLimited = (reason?: string): boolean => reason === 'RATE_LIMITED';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  // Every outgoing call is serialized through the shared queue (Step 3) —
  // this is the one place all AI traffic funnels through, so it's also
  // where a future weather/AQI/rulebook client would plug in the same way.
  return enqueueRequest(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.status === 429) {
      const err = new Error('Request rate-limited');
      (err as Error & { code?: string }).code = 'RATE_LIMITED';
      throw err;
    }
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.json()) as T;
  });
}

export async function fetchMineAnalysis(mineProfile: MineProfile, forceRefresh = false): Promise<MineAiAnalysis> {
  try {
    return await postJson<MineAiAnalysis>('/api/ai/mine-analysis', { mineProfile, forceRefresh });
  } catch (err) {
    const reason = (err as Error & { code?: string })?.code === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'network_error';
    return {
      riskLevel: 'MODERATE',
      summary: 'AI analysis temporarily unavailable. The deterministic risk score remains accurate.',
      keyRiskFactors: [],
      recurringPatterns: [],
      anomalies: [],
      recommendedActions: [],
      priority: 'MONITOR',
      confidence: 0,
      degraded: true,
      degradedReason: reason
    };
  }
}

export async function fetchSubsidiaryAnalysis(subsidiaryProfiles: SubsidiaryProfile[]): Promise<{ items: SubsidiaryAiItem[]; degraded: boolean; degradedReason?: string }> {
  try {
    return await postJson('/api/ai/subsidiary-analysis', { subsidiaryProfiles });
  } catch (err) {
    const reason = (err as Error & { code?: string })?.code === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'network_error';
    return { items: [], degraded: true, degradedReason: reason };
  }
}

export async function fetchGovernanceSummary(orgProfile: OrgProfile): Promise<GovernanceAiSummary> {
  try {
    return await postJson('/api/ai/governance-summary', { orgProfile });
  } catch (err) {
    const reason = (err as Error & { code?: string })?.code === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'network_error';
    return { headline: 'AI governance summary temporarily unavailable.', highlights: [], priority: 'MONITOR', degraded: true, degradedReason: reason };
  }
}

export async function askGovernanceAi(question: string, context: unknown, roleLabel: string): Promise<AskAiResult> {
  try {
    return await postJson('/api/ai/ask', { question, context, roleLabel });
  } catch (err) {
    const reason = (err as Error & { code?: string })?.code === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'network_error';
    return {
      answer: reason === 'RATE_LIMITED' ? RATE_LIMIT_MESSAGE : 'AI analysis temporarily unavailable. Please try again shortly.',
      citedData: [],
      followUpSuggestions: [],
      degraded: true,
      degradedReason: reason
    };
  }
}
