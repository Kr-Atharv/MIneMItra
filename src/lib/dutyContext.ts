import { MINE_LOCATIONS, ESCALATION_FEED, STATUTORY_REGULATIONS } from '../data/mockData';
import { AppRole, ComplaintItem } from '../types';
import { buildAskContext } from './askContext';

/**
 * A specialized version of askContext.ts's pattern (Step 4), reframed
 * around "what's on my plate right now" instead of "what's my risk
 * picture". This is what grounds "What's my duty today?" in real numbers
 * from GovernanceContext's actual state, instead of a generic guess —
 * same RBAC scoping rule as askContext.ts: only what this role would
 * already see elsewhere in the app.
 */
export interface DutyBundle {
  role: string;
  todayIso: string;
  scope: 'single mine' | 'organization-wide';
  mine?: { name: string; subsidiary: string; area: string };
  pendingQueueCount: number;
  pendingQueueSample: string[];
  overdueStatutoryCount: number;
  overdueStatutorySample: { regulation: string; description: string; dueDate: string }[];
  dueSoonStatutoryCount: number;
  openEscalationCount: number;
  openEscalationSample: { type: string; severity: string; description: string; level: number }[];
}

export function buildDutyContext(
  currentRole: AppRole,
  mineId: string,
  filteredComplaintsForRole: ComplaintItem[]
): DutyBundle {
  const todayIso = new Date().toISOString().slice(0, 10);
  const orgWide = currentRole === 'corporate_director' || currentRole === 'audit_compliance_officer' || currentRole === 'regulatory_authority';
  const mine = MINE_LOCATIONS.find((m) => m.id === mineId);

  // Statutory register isn't mine-tagged in the data model, so mine-scoped
  // roles see the same overdue/due-soon register org-wide roles do — the
  // thing that actually differs per mine/role is the officer's own pending
  // queue and their mine's open escalations, below.
  const overdueStatutory = STATUTORY_REGULATIONS.filter((r) => r.status === 'Overdue');
  const dueSoonStatutory = STATUTORY_REGULATIONS.filter((r) => r.status === 'Due <48h');

  const openEscalations = ESCALATION_FEED.filter(
    (e) => (orgWide || e.mineName === mine?.name) && (e.status === 'Open' || e.status === 'Escalated')
  );

  return {
    role: currentRole,
    todayIso,
    scope: orgWide ? 'organization-wide' : 'single mine',
    mine: mine ? { name: mine.name, subsidiary: mine.subsidiary, area: mine.area } : undefined,
    pendingQueueCount: filteredComplaintsForRole.length,
    pendingQueueSample: filteredComplaintsForRole.slice(0, 3).map((c) => `${c.title} (${c.severity})`),
    overdueStatutoryCount: overdueStatutory.length,
    overdueStatutorySample: overdueStatutory.slice(0, 3).map((r) => ({
      regulation: r.regulationId,
      description: r.provisionDescription,
      dueDate: r.dueDate
    })),
    dueSoonStatutoryCount: dueSoonStatutory.length,
    openEscalationCount: openEscalations.length,
    openEscalationSample: openEscalations.slice(0, 3).map((e) => ({
      type: e.type,
      severity: e.severity,
      description: e.description,
      level: e.level
    }))
  };
}

/**
 * The single context-builder both AskGovernanceAI (4a) and
 * DutyVoiceAssistant (4b) call — one path in, so "What's my duty today?"
 * is answered identically regardless of which assistant asked it, and
 * neither assistant maintains its own copy of this merge logic.
 */
export function buildGroundedContext(
  currentRole: AppRole,
  mineId: string,
  complaints: ComplaintItem[],
  filteredComplaintsForRole: ComplaintItem[]
) {
  return {
    ...buildAskContext(currentRole, mineId, complaints),
    duty: buildDutyContext(currentRole, mineId, filteredComplaintsForRole)
  };
}
