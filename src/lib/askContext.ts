import { MINE_LOCATIONS, ESCALATION_FEED, STATUTORY_REGULATIONS, SUBSIDIARIES } from '../data/mockData';
import { AppRole, ComplaintItem } from '../types';
import { riskScoreOf, riskBandOf } from './riskEngine';
import { computeRiskSignals } from './mineProfile';

/**
 * Retrieves only the structured data the current role is already shown on
 * the Governance Overview page, and nothing more — mirrors the existing
 * RBAC scoping used throughout the rest of the application (spec Section
 * 15/16: "do NOT send the entire database blindly to the LLM").
 */
export function buildAskContext(currentRole: AppRole, mineId: string, complaints: ComplaintItem[]) {
  const mineSummaries = MINE_LOCATIONS.map((m) => {
    const signals = computeRiskSignals(m, complaints);
    return {
      mine: m.name,
      subsidiary: m.subsidiary,
      area: m.area,
      compliance: m.cmrComplianceRate,
      riskBand: riskBandOf(m, signals).toUpperCase(),
      // Step 2: pass the same widened signals used everywhere else so the
      // chatbot's numbers never drift from the dashboard's numbers.
      riskScore: riskScoreOf(m, signals),
      pendingInspections: m.pendingInspections,
      activeViolations: ESCALATION_FEED.filter((e) => e.mineName === m.name && e.status !== 'Resolved').length
    };
  });

  if (currentRole === 'corporate_director' || currentRole === 'audit_compliance_officer' || currentRole === 'regulatory_authority') {
    const subsidiarySummaries = SUBSIDIARIES.map((s) => {
      const mines = MINE_LOCATIONS.filter((m) => m.subsidiary === s.code);
      const count = mines.length || 1;
      return {
        subsidiary: s.code,
        mineCount: mines.length,
        avgCompliance: Math.round((mines.reduce((sum, m) => sum + m.cmrComplianceRate, 0) / count) * 10) / 10,
        avgRisk: Math.round(mines.reduce((sum, m) => sum + riskScoreOf(m, computeRiskSignals(m, complaints)), 0) / count)
      };
    });
    return {
      scope: currentRole === 'corporate_director' ? 'organization-wide' : currentRole === 'regulatory_authority' ? 'external regulatory (read-only)' : 'national regulatory',
      mines: mineSummaries,
      subsidiaries: subsidiarySummaries,
      overdueStatutoryItems: STATUTORY_REGULATIONS.filter((r) => r.status === 'Overdue').map((r) => ({
        regulation: r.regulationId,
        description: r.provisionDescription,
        dueDate: r.dueDate
      }))
    };
  }

  // Mine-scoped roles (safety_officer, maintenance_officer, field_inspector):
  // only their own assigned mine and its own complaints/escalations.
  const mine = MINE_LOCATIONS.find((m) => m.id === mineId);
  const mineComplaints = complaints.filter((c) => c.mineId === mineId).map((c) => ({
    title: c.title,
    category: c.category,
    severity: c.severity,
    status: c.status
  }));
  const mineEscalations = mine
    ? ESCALATION_FEED.filter((e) => e.mineName === mine.name).map((e) => ({
        type: e.type,
        severity: e.severity,
        status: e.status,
        description: e.description
      }))
    : [];

  return {
    scope: 'single mine',
    mine: mine
      ? {
          mine: mine.name,
          subsidiary: mine.subsidiary,
          area: mine.area,
          compliance: mine.cmrComplianceRate,
          riskBand: riskBandOf(mine, computeRiskSignals(mine, complaints)).toUpperCase(),
          riskScore: riskScoreOf(mine, computeRiskSignals(mine, complaints)),
          pendingInspections: mine.pendingInspections
        }
      : null,
    complaints: mineComplaints,
    escalations: mineEscalations
  };
}

