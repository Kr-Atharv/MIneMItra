import { MINE_LOCATIONS, GIS_MARKERS } from './mockData';

/**
 * One row per coal mine, merging its static MineLocation profile with the
 * live GIS hazard marker (if DGMS field inspection has flagged something for
 * that mine). This is the single source of truth for the real satellite/
 * street map — every mine in MINE_LOCATIONS is guaranteed to appear here so
 * "all coal mines" are always visible, not just the ones with an open issue.
 */
export interface MineMapPoint {
  id: string;
  mineName: string;
  subsidiary: string;
  area: string;
  type: string;
  riskTier: 'Low' | 'Medium' | 'High';
  dgmsAuditScore: number;
  cmrComplianceRate: number;
  pendingInspections: number;
  activeManpower: number;
  firstClassManager: string;
  lat: number;
  lng: number;
  status: 'safe' | 'observation' | 'critical';
  title: string;
  benchSector: string;
  inspectorName: string;
  timestamp: string;
  observation: string;
  violationCode: string;
  severityText: string;
  actionPlan: string;
  pinColor?: string;
  trackingNumber?: string;
  category?: string;
  severity?: string;
  lifecycleLabel?: string;
  reportedAt?: string;
  complaintId?: string;
  /** Role-dependent extra rows rendered in the same popup — see src/lib/roleVisibility.ts */
  detailRows?: { label: string; value: string }[];
}

export const MINE_MAP_POINTS: MineMapPoint[] = MINE_LOCATIONS.map((mine) => {
  const hazard = GIS_MARKERS.find((g) => g.mineName === mine.name);
  return {
    id: mine.id,
    mineName: mine.name,
    subsidiary: mine.subsidiary,
    area: mine.area,
    type: mine.type,
    riskTier: mine.riskTier,
    dgmsAuditScore: mine.dgmsAuditScore,
    cmrComplianceRate: mine.cmrComplianceRate,
    pendingInspections: mine.pendingInspections,
    activeManpower: mine.activeManpower,
    firstClassManager: mine.firstClassManager,
    lat: mine.coordinates.lat,
    lng: mine.coordinates.lng,
    status: hazard?.status ?? 'safe',
    title: hazard?.title ?? `${mine.name} — No Active Field Escalation`,
    benchSector: hazard?.benchSector ?? 'Full Lease Area',
    inspectorName: hazard?.inspectorName ?? mine.firstClassManager,
    timestamp: hazard?.timestamp ?? '05 Sep 2026, 09:00 AM IST',
    observation: hazard?.observation ?? `Routine statutory patrol found ${mine.name} operating within CMR 2017 parameters. No corrective action pending beyond the ${mine.pendingInspections} inspection(s) already scheduled.`,
    violationCode: hazard?.violationCode ?? 'Statutory Compliant',
    severityText: hazard?.severityText ?? 'Normal Operation',
    actionPlan: hazard?.actionPlan ?? 'Continue routine shift monitoring per statutory schedule.'
  };
});
