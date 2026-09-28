import { AppRole, ComplaintItem } from '../types';

/**
 * ROLE-BASED GIS PIN VISIBILITY
 * -----------------------------
 * Mine-boundary scoping already happens above this (GISMonitoring's
 * `scopedComplaints`, enforced again server-side in
 * server/routes/complaints.js). This module adds the finer-grained,
 * per-role rules from the spec on top of that same scoped list — it does
 * not introduce a new map, popup, or endpoint.
 */

/** Which complaints within the officer's mine are relevant to their role's queue. */
export function isComplaintRelevantToRole(c: ComplaintItem, role: AppRole): boolean {
  switch (role) {
    case 'field_inspector':
      // "Pending inspection pins" only.
      return c.status === 'PENDING_INSPECTION';
    case 'maintenance_officer':
      // "Hazards requiring action / assigned maintenance tasks" only.
      return c.status === 'ASSIGNED_MAINTENANCE';
    // safety_officer, audit_compliance_officer, corporate_director and
    // regulatory_authority all see the full (already mine/org-scoped) set
    // of active hazards per the spec's broader wording for those roles.
    default:
      return true;
  }
}

export interface PinDetailRow {
  label: string;
  value: string;
}

/**
 * Same pin, role-dependent extra rows — appended below the common
 * header (mine, category, severity, lifecycle status, reported time)
 * that every role already sees in the existing popup/side panel.
 * Every value here comes from real complaint/mine data already in the
 * app; nothing is invented per role.
 */
export function buildRolePinDetails(
  c: ComplaintItem,
  role: AppRole,
  mineComplianceRate: number,
  assignedOfficerName: string
): PinDetailRow[] {
  const riskScore = c.aiInsight?.riskScore;
  const inspectionStatus = c.inspectedBy
    ? `Inspected by ${c.inspectedBy.name}`
    : c.status === 'PENDING_INSPECTION'
    ? 'Pending Inspection'
    : '—';
  const maintenanceStatus = c.maintenanceBy
    ? `Completed by ${c.maintenanceBy.name}`
    : c.status === 'ASSIGNED_MAINTENANCE'
    ? 'Assigned Maintenance'
    : '—';
  const auditStatus = c.auditVerifiedBy
    ? `Certified (${c.auditVerifiedBy.dgmsReceiptNumber})`
    : c.status === 'PENDING_AUDIT'
    ? 'Pending Audit'
    : '—';
  const correctiveAction = c.maintenanceBy?.actionTaken || c.aiInsight?.suggestedMitigation || '—';

  const rows: PinDetailRow[] = [];
  switch (role) {
    case 'field_inspector':
      if (riskScore != null) rows.push({ label: 'Risk Score', value: String(riskScore) });
      rows.push({ label: 'Inspection', value: inspectionStatus });
      rows.push({ label: 'Evidence', value: `${c.media.length} file(s)` });
      break;

    case 'maintenance_officer':
      if (riskScore != null) rows.push({ label: 'Risk Score', value: String(riskScore) });
      rows.push({ label: 'Corrective Action', value: correctiveAction });
      rows.push({ label: 'Maintenance', value: maintenanceStatus });
      break;

    case 'audit_compliance_officer':
      if (riskScore != null) rows.push({ label: 'Risk Score', value: String(riskScore) });
      rows.push({ label: 'Compliance', value: `${mineComplianceRate}%` });
      rows.push({ label: 'Corrective Action', value: correctiveAction });
      rows.push({ label: 'Audit Status', value: auditStatus });
      break;

    case 'corporate_director':
      if (riskScore != null) rows.push({ label: 'Risk Score', value: String(riskScore) });
      rows.push({ label: 'Compliance', value: `${mineComplianceRate}%` });
      rows.push({ label: 'Inspection', value: inspectionStatus });
      rows.push({ label: 'Assigned Officer', value: assignedOfficerName });
      rows.push({ label: 'Corrective Action', value: correctiveAction });
      rows.push({ label: 'Audit Status', value: auditStatus });
      break;

    case 'regulatory_authority':
      if (riskScore != null) rows.push({ label: 'Risk Score', value: String(riskScore) });
      rows.push({ label: 'Compliance', value: `${mineComplianceRate}%` });
      rows.push({ label: 'Violation', value: c.regulationCode });
      rows.push({ label: 'Inspection', value: inspectionStatus });
      rows.push({ label: 'Audit Status', value: auditStatus });
      break;

    case 'safety_officer':
    default:
      // Basic complaint status + location only — no org-wide sensitive
      // data (compliance %, other officers, audit receipts, etc.).
      break;
  }
  return rows;
}
