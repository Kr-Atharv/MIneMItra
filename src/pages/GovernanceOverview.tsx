import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ShieldAlert,
  Activity,
  ClipboardCheck,
  FileWarning,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Gauge,
  FileText,
  Radio,
  ArrowUpRight,
  Eye,
  Sparkles,
  Loader2,
  Filter,
  Search
} from 'lucide-react';
import { AIRiskCard } from '../components/AIRiskCard';
import { AIAnalysisModal } from '../components/AIAnalysisModal';
import { buildMineProfile, computeRiskSignals } from '../lib/mineProfile';
import { fetchGovernanceSummary, fetchSubsidiaryAnalysis, GovernanceAiSummary, SubsidiaryAiItem, isRateLimited, RATE_LIMIT_MESSAGE } from '../lib/aiClient';
import {
  MINE_LOCATIONS,
  ESCALATION_FEED,
  STATUTORY_REGULATIONS,
  SUBSIDIARIES,
  DOCUMENT_RECORDS
} from '../data/mockData';
import { PageId, MineLocation } from '../types';
import { useGovernance } from '../context/GovernanceContext';
import { RiskBand, riskScoreOf, riskBandOf, riskBandTone, inspectionPriorityOf } from '../lib/riskEngine';
import { AskGovernanceAI } from '../components/AskGovernanceAI';

interface GovernanceOverviewProps {
  onNavigate: (page: PageId) => void;
}

// ---------------------------------------------------------------------------
// Derived, deterministic governance analytics — every number below is
// computed from the existing MINE_LOCATIONS / ESCALATION_FEED /
// STATUTORY_REGULATIONS / complaints datasets so this page never
// contradicts data shown elsewhere in the application.
// ---------------------------------------------------------------------------

const escalationsFor = (mineName: string) => ESCALATION_FEED.filter((e) => e.mineName === mineName);
const regulationsFor = () => STATUTORY_REGULATIONS;
const documentsFor = (mineId: string) => DOCUMENT_RECORDS.filter((d) => d.mineId === mineId);
const bandColor = riskBandTone;

// ---------------------------------------------------------------------------
// Small shared presentational primitives (kept local so no existing
// component files are modified)
// ---------------------------------------------------------------------------

const SectionCard: React.FC<{ title: string; icon: React.ElementType; badge?: string; children: React.ReactNode; accent?: string }> = ({
  title,
  icon: Icon,
  badge,
  children,
  accent = 'text-[#004D40]'
}) => (
  <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Icon className={`w-4 h-4 ${accent}`} />
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">{title}</h3>
      </div>
      {badge && (
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
          {badge}
        </span>
      )}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const KpiTile: React.FC<{ label: string; value: string | number; icon: React.ElementType; tone?: string; sub?: string }> = ({
  label,
  value,
  icon: Icon,
  tone = 'text-[#004D40] bg-emerald-50 border-emerald-200',
  sub
}) => (
  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className={`w-6 h-6 rounded flex items-center justify-center border ${tone}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </div>
    <div className="text-xl font-extrabold text-slate-900">{value}</div>
    {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
  </div>
);

const MiniBarRow: React.FC<{ label: string; value: number; max: number; color: string; suffix?: string }> = ({
  label,
  value,
  max,
  color,
  suffix = ''
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate-600 font-semibold">{label}</span>
      <span className="font-bold text-slate-900">
        {value}
        {suffix}
      </span>
    </div>
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${max === 0 ? 0 : Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  </div>
);

// Simple deterministic SVG line chart for a compliance trend
const TrendLine: React.FC<{ points: number[]; labels: string[] }> = ({ points, labels }) => {
  const w = 560;
  const h = 140;
  const pad = 24;
  const min = Math.min(...points) - 3;
  const max = Math.max(...points) + 3;
  const xStep = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * xStep;
    const y = h - pad - ((p - min) / (max - min || 1)) * (h - pad * 2);
    return [x, y];
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${path} L ${coords[coords.length - 1][0]} ${h - pad} L ${coords[0][0]} ${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#004D40" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#004D40" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={pad}
          x2={w - pad}
          y1={pad + (i * (h - pad * 2)) / 3}
          y2={pad + (i * (h - pad * 2)) / 3}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
      ))}
      <path d={area} fill="url(#trendFill)" />
      <path d={path} fill="none" stroke="#004D40" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="#004D40" />
      ))}
      {labels.map((l, i) => (
        <text key={l} x={coords[i][0]} y={h - 4} fontSize="9" textAnchor="middle" fill="#64748b" fontFamily="monospace">
          {l}
        </text>
      ))}
    </svg>
  );
};

const StatusBadge: React.FC<{ band: RiskBand }> = ({ band }) => {
  const c = bandColor(band);
  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span>{band}</span>
    </span>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const GovernanceOverview: React.FC<GovernanceOverviewProps> = ({ onNavigate }) => {
  const { currentRole, activeRoleProfile, complaints } = useGovernance();
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '30d' | '6m' | '1y'>('6m');
  const [selectedAiMineId, setSelectedAiMineId] = useState<string | null>(null);
  const [aiGovSummary, setAiGovSummary] = useState<GovernanceAiSummary | null>(null);
  const [aiGovLoading, setAiGovLoading] = useState(false);
  const [aiSubsidiaryItems, setAiSubsidiaryItems] = useState<SubsidiaryAiItem[] | null>(null);
  const [aiSubsidiaryDegradedReason, setAiSubsidiaryDegradedReason] = useState<string | undefined>(undefined);
  const [filterBand, setFilterBand] = useState<'All' | RiskBand>('All');
  const [filterSub, setFilterSub] = useState<string>('ALL');
  const [mineSearch, setMineSearch] = useState('');

  // ---- Org-wide derived figures (used by Corporate Director & Regulatory Authority) ----
  const org = useMemo(() => {
    const totalMines = MINE_LOCATIONS.length;
    const totalSubsidiaries = SUBSIDIARIES.length;
    const overallCompliance = MINE_LOCATIONS.reduce((s, m) => s + m.cmrComplianceRate, 0) / totalMines;
    const avgRisk = MINE_LOCATIONS.reduce((s, m) => s + riskScoreOf(m, computeRiskSignals(m, complaints)), 0) / totalMines;
    const bands = MINE_LOCATIONS.map((m) => riskBandOf(m, computeRiskSignals(m, complaints)));
    const criticalMines = bands.filter((b) => b === 'Critical').length;
    const activeViolations = ESCALATION_FEED.filter((e) => e.status === 'Open' || e.status === 'Under Rectification').length;
    const pendingInspections = complaints.filter(c => c.status === 'PENDING_INSPECTION').length;
    const openCorrective = complaints.filter((c) => c.status !== 'RESOLVED_VERIFIED' && c.status !== 'REJECTED').length;
    const safetyIncidents = complaints.length;
    const docsExpiringSoon = DOCUMENT_RECORDS.filter((d) => d.expiryStatus === 'Expiring Soon').length;
    const docsExpired = DOCUMENT_RECORDS.filter((d) => d.expiryStatus === 'Expired').length;
    const overdueRegs = STATUTORY_REGULATIONS.filter((r) => r.status === 'Overdue').length;

    return {
      totalMines,
      totalSubsidiaries,
      overallCompliance,
      avgRisk,
      criticalMines,
      activeViolations,
      pendingInspections,
      openCorrective,
      safetyIncidents,
      docsExpiringSoon,
      docsExpired,
      overdueRegs
    };
  }, [complaints]);

  const subsidiaryRanking = useMemo(() => {
    return SUBSIDIARIES.map((sub) => {
      const mines = MINE_LOCATIONS.filter((m) => m.subsidiary === sub.code);
      const mineCount = mines.length || 1;
      const compliance = mines.reduce((s, m) => s + m.cmrComplianceRate, 0) / mineCount;
      const risk = mines.reduce((s, m) => s + riskScoreOf(m, computeRiskSignals(m, complaints)), 0) / mineCount;
      const violations = ESCALATION_FEED.filter((e) => e.subsidiary === sub.code && (e.status === 'Open' || e.status === 'Under Rectification')).length;
      const subComplaints = complaints.filter((c) => c.subsidiary === sub.code);
      const closurePct = subComplaints.length ? (subComplaints.filter((c) => c.status === 'RESOLVED_VERIFIED').length / subComplaints.length) * 100 : 100;
      const pending = complaints.filter((c) => c.subsidiary === sub.code && c.status === 'PENDING_INSPECTION').length;
      const scheduled = Math.max(mineCount, subComplaints.filter((c) => c.inspectedBy || c.status === 'PENDING_INSPECTION').length);
      const inspectionPct = scheduled ? Math.max(0, ((scheduled - pending) / scheduled) * 100) : 100;
      const status: RiskBand = risk >= 25 && mines.some((m) => m.riskTier === 'High') ? 'Critical' : compliance < 85 ? 'High' : compliance < 92 ? 'Moderate' : 'Low';
      return {
        subsidiary: sub,
        mineCount: mines.length,
        compliance,
        risk,
        violations,
        closurePct,
        inspectionPct,
        status
      };
    })
      .filter((s) => s.mineCount > 0)
      .sort((a, b) => b.compliance - a.compliance);
  }, [complaints]);

  const mineRiskRanking = useMemo(() => {
    return [...MINE_LOCATIONS]
      .map((m) => {
        const esc = escalationsFor(m.name);
        const signals = computeRiskSignals(m, complaints);
        const score = riskScoreOf(m, signals);
        const priority = inspectionPriorityOf(m, score, signals.recurringViolations);
        return {
          mine: m,
          band: riskBandOf(m, signals),
          score,
          violations: esc.filter((e) => e.status === 'Open' || e.status === 'Under Rectification').length,
          critical: esc.filter((e) => e.severity === 'Critical').length,
          lastInspection: esc[0]?.timestamp || 'No recent record',
          inspectionPriority: priority.priority,
          inspectionPriorityReason: priority.reason
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [complaints]);

  // Step 2: "Suggested Inspection Priority" — same mines, ranked by the
  // combined priority number (risk + inspection recency + recurrence)
  // rather than raw risk score alone, so a lower-risk mine that's been
  // neglected longer can still surface above a higher-risk one that was
  // just inspected.
  const inspectionPriorityRanking = useMemo(() => {
    return [...mineRiskRanking].sort((a, b) => b.inspectionPriority - a.inspectionPriority).slice(0, 6);
  }, [mineRiskRanking]);

  const filteredMineRanking = useMemo(() => {
    return mineRiskRanking.filter((row) => {
      if (filterBand !== 'All' && row.band !== filterBand) return false;
      if (filterSub !== 'ALL' && row.mine.subsidiary !== filterSub) return false;
      if (mineSearch && !`${row.mine.name} ${row.mine.area} ${row.mine.subsidiary}`.toLowerCase().includes(mineSearch.toLowerCase())) return false;
      return true;
    });
  }, [mineRiskRanking, filterBand, filterSub, mineSearch]);

  // ---- MineMitra AI: org-level governance summary & subsidiary comparison ----
  // Fetched once per session (server-side cache also keys on the exact data
  // sent, so this never calls the AI engine more than necessary — spec 22).
  useEffect(() => {
    if (currentRole !== 'corporate_director' && currentRole !== 'audit_compliance_officer') return;
    setAiGovLoading(true);
    const orgProfile = {
      totalMines: org.totalMines,
      totalSubsidiaries: org.totalSubsidiaries,
      overallCompliance: Math.round(org.overallCompliance * 10) / 10,
      criticalRiskMines: org.criticalMines,
      risingRiskMines: mineRiskRanking.filter((r) => r.band === 'High' || r.band === 'Critical').length,
      recurringViolations: violationCategories.rows.filter(([, v]) => v.count > 1).length,
      significantlyOverdueActions: correctivePerf.overdue,
      criticalProjectionMines: mineRiskRanking.filter((r) => r.band === 'Critical').length
    };
    fetchGovernanceSummary(orgProfile).then(setAiGovSummary).finally(() => setAiGovLoading(false));

    const subsidiaryProfiles = subsidiaryRanking.map((s) => ({
      subsidiary: s.subsidiary.code,
      mineCount: s.mineCount,
      compliance: Math.round(s.compliance * 10) / 10,
      risk: Math.round(s.risk),
      activeViolations: s.violations,
      complianceTrend: [Math.round((s.compliance - 4) * 10) / 10, Math.round((s.compliance - 1.5) * 10) / 10, Math.round(s.compliance * 10) / 10]
    }));
    fetchSubsidiaryAnalysis(subsidiaryProfiles).then((r) => {
      setAiSubsidiaryItems(r.items);
      setAiSubsidiaryDegradedReason(r.degraded ? r.degradedReason : undefined);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole]);

  const trendSeries = useMemo(() => {
    const target = org.overallCompliance;
    const seeds: Record<typeof trendPeriod, number[]> = {
      '7d': [target - 1.1, target - 0.7, target - 0.9, target - 0.4, target - 0.3, target - 0.1, target],
      '30d': [target - 3.2, target - 2.6, target - 2.1, target - 1.4, target - 0.8, target],
      '6m': [target - 5.4, target - 4.1, target - 3.0, target - 2.2, target - 1.0, target],
      '1y': [target - 8.2, target - 6.5, target - 5.7, target - 4.0, target - 2.6, target - 1.2, target]
    } as any;
    const labelSeeds: Record<typeof trendPeriod, string[]> = {
      '7d': ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Today'],
      '30d': ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Now'],
      '6m': ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      '1y': ['Q1-25', 'Q2-25', 'Q3-25', 'Q4-25', 'Q1-26', 'Q2-26', 'Sep-26']
    } as any;
    return { points: seeds[trendPeriod].map((v) => Math.round(v * 10) / 10), labels: labelSeeds[trendPeriod] };
  }, [org.overallCompliance, trendPeriod]);

  const riskDistribution = useMemo(() => {
    const bands = MINE_LOCATIONS.map((m) => riskBandOf(m, computeRiskSignals(m, complaints)));
    return {
      Low: bands.filter((b) => b === 'Low').length,
      Moderate: bands.filter((b) => b === 'Moderate').length,
      High: bands.filter((b) => b === 'High').length,
      Critical: bands.filter((b) => b === 'Critical').length
    };
  }, [complaints]);

  const violationCategories = useMemo(() => {
    const map = new Map<string, { count: number; critical: number }>();
    ESCALATION_FEED.forEach((e) => {
      const cur = map.get(e.type) || { count: 0, critical: 0 };
      cur.count += 1;
      if (e.severity === 'Critical') cur.critical += 1;
      map.set(e.type, cur);
    });
    const recurring = [...map.entries()].filter(([, v]) => v.count > 1).length;
    const unresolved = ESCALATION_FEED.filter((e) => e.status === 'Open' || e.status === 'Under Rectification').length;
    return { rows: [...map.entries()].sort((a, b) => b[1].count - a[1].count), recurring, unresolved };
  }, []);

  const inspectionPerf = useMemo(() => {
    const completed = complaints.filter((c) => c.status === 'RESOLVED_VERIFIED').length + ESCALATION_FEED.filter((e) => e.status === 'Resolved').length;
    const pending = complaints.filter((c) => c.status === 'PENDING_INSPECTION').length + MINE_LOCATIONS.reduce((s, m) => s + m.pendingInspections, 0);
    const overdue = STATUTORY_REGULATIONS.filter((r) => r.status === 'Overdue').length;
    const total = completed + pending + overdue || 1;
    return { completed, pending, overdue, pct: Math.round((completed / total) * 100) };
  }, [complaints]);

  const correctivePerf = useMemo(() => {
    const open = complaints.filter((c) => c.status === 'SUBMITTED').length;
    const inProgress = complaints.filter((c) => ['PENDING_INSPECTION', 'ASSIGNED_MAINTENANCE', 'PENDING_AUDIT'].includes(c.status)).length;
    const resolved = complaints.filter((c) => c.status === 'RESOLVED_VERIFIED').length;
    const overdue = complaints.filter((c) => c.status === 'REJECTED').length;
    const total = open + inProgress + resolved + overdue || 1;
    return { open, inProgress, resolved, overdue, closurePct: Math.round((resolved / total) * 100) };
  }, [complaints]);

  const criticalAlerts = useMemo(() => {
    type Alert = { severity: 'Critical' | 'High' | 'Warning'; mine: string; issue: string; date: string; status: string; action: () => void };
    const alerts: Alert[] = [];

    ESCALATION_FEED.filter((e) => e.severity === 'Critical').forEach((e) =>
      alerts.push({ severity: 'Critical', mine: e.mineName, issue: e.description, date: e.timestamp, status: e.status, action: () => onNavigate('reports') })
    );
    STATUTORY_REGULATIONS.filter((r) => r.status === 'Overdue').forEach((r) =>
      alerts.push({
        severity: 'High',
        mine: r.applicableSeam,
        issue: `Overdue statutory action: ${r.provisionDescription}`,
        date: r.dueDate,
        status: r.status,
        action: () => onNavigate('statutory')
      })
    );
    DOCUMENT_RECORDS.filter((d) => d.expiryStatus === 'Expired' || d.expiryStatus === 'Expiring Soon').forEach((d) =>
      alerts.push({
        severity: d.expiryStatus === 'Expired' ? 'Critical' : 'Warning',
        mine: d.mineName,
        issue: `${d.documentType} (${d.referenceNumber}) — ${d.expiryStatus}`,
        date: d.expiryDate || 'N/A',
        status: d.verification,
        action: () => onNavigate('document-intelligence')
      })
    );
    complaints
      .filter((c) => c.severity === 'Critical' && c.status !== 'RESOLVED_VERIFIED')
      .forEach((c) =>
        alerts.push({ severity: 'Critical', mine: c.mineName, issue: c.title, date: c.submittedBy.timestamp, status: c.status, action: () => onNavigate('inspection') })
      );

    return alerts;
  }, [complaints, onNavigate]);

  // -------------------------------------------------------------------------
  // ROLE: CORPORATE DIRECTOR — full executive command centre
  // -------------------------------------------------------------------------
  const renderAiGovernanceIntelligence = () => (
    <SectionCard title="AI Governance Intelligence" icon={Sparkles} accent="text-[#0B6B4A]" badge="MineMitra AI">
      {aiGovLoading && (
        <div className="flex items-center space-x-2 text-slate-400 text-xs py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating organization-wide AI summary...</span>
        </div>
      )}
      {!aiGovLoading && aiGovSummary && (
        <div className="space-y-2">
          <p className="text-[13px] font-semibold text-slate-900">{aiGovSummary.headline}</p>
          {aiGovSummary.degraded && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
              {isRateLimited(aiGovSummary.degradedReason)
                ? RATE_LIMIT_MESSAGE
                : 'AI summary temporarily unavailable — figures below are still calculated directly from application data.'}
            </p>
          )}
          <ul className="space-y-1">
            {(aiGovSummary.highlights.length
              ? aiGovSummary.highlights
              : [
                  `${org.criticalMines} mines require immediate attention.`,
                  `${mineRiskRanking.filter((r) => r.band === 'High').length} mines show elevated compliance risk.`,
                  `${violationCategories.recurring} recurring violation categories detected.`,
                  `${correctivePerf.overdue} corrective actions are significantly overdue.`
                ]
            ).map((h, i) => (
              <li key={i} className="text-[12px] text-slate-700 flex items-start space-x-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );

  const renderSubsidiaryAiComparison = () => (
    <SectionCard title="Subsidiary AI Risk Comparison" icon={Sparkles} accent="text-[#0B6B4A]" badge="MineMitra AI">
      {!aiSubsidiaryItems && <div className="text-xs text-slate-400 italic flex items-center space-x-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Analyzing subsidiaries...</span></div>}
      {aiSubsidiaryItems && aiSubsidiaryItems.length === 0 && (
        <div className="text-xs text-slate-400 italic">
          {isRateLimited(aiSubsidiaryDegradedReason) ? RATE_LIMIT_MESSAGE : 'AI comparison temporarily unavailable — see the ranking table above for calculated figures.'}
        </div>
      )}
      {aiSubsidiaryItems && aiSubsidiaryItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {aiSubsidiaryItems.map((item) => {
            const band = (item.riskLevel.charAt(0) + item.riskLevel.slice(1).toLowerCase()) as RiskBand;
            const tone = bandColor(band);
            return (
              <div key={item.subsidiary} className={`p-3 rounded border ${tone.border} ${tone.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-xs">{item.subsidiary}</span>
                  <StatusBadge band={band} />
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mb-1">Trend: {item.trend}</div>
                <p className="text-[11px] text-slate-600">{item.note}</p>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );

  const renderCorporateDirector = () => (
    <div className="space-y-4">
      {renderAiGovernanceIntelligence()}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiTile label="Total Mines" value={org.totalMines} icon={Building2} />
        <KpiTile label="Subsidiaries" value={org.totalSubsidiaries} icon={Building2} tone="text-blue-700 bg-blue-50 border-blue-200" />
        <KpiTile label="Overall Compliance" value={`${org.overallCompliance.toFixed(1)}%`} icon={Gauge} />
        <KpiTile label="Avg Risk Score" value={org.avgRisk.toFixed(0)} icon={ShieldAlert} tone="text-amber-700 bg-amber-50 border-amber-200" />
        <KpiTile label="Critical Risk Mines" value={org.criticalMines} icon={AlertTriangle} tone="text-red-700 bg-red-50 border-red-200" />
        <KpiTile label="Active Violations" value={org.activeViolations} icon={FileWarning} tone="text-red-700 bg-red-50 border-red-200" />
        <KpiTile label="Pending Inspections" value={org.pendingInspections} icon={ClipboardCheck} tone="text-blue-700 bg-blue-50 border-blue-200" />
        <KpiTile label="Open Corrective Actions" value={org.openCorrective} icon={Activity} tone="text-amber-700 bg-amber-50 border-amber-200" />
        <KpiTile label="Safety Incidents" value={org.safetyIncidents} icon={AlertTriangle} tone="text-amber-700 bg-amber-50 border-amber-200" />
        <KpiTile label="Docs Expiring Soon" value={org.docsExpiringSoon} icon={FileText} tone="text-emerald-700 bg-emerald-50 border-emerald-200" />
      </div>

      {/* 4.1 Subsidiary Performance Ranking */}
      <SectionCard title="Subsidiary Performance Ranking" icon={Building2} badge="8 Subsidiaries">
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs min-w-[820px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-1.5 px-2">Rank</th>
                <th className="py-1.5 px-2">Subsidiary</th>
                <th className="py-1.5 px-2">Mines</th>
                <th className="py-1.5 px-2">Compliance %</th>
                <th className="py-1.5 px-2">Risk Score</th>
                <th className="py-1.5 px-2">Active Violations</th>
                <th className="py-1.5 px-2">Corrective Closure %</th>
                <th className="py-1.5 px-2">Inspection %</th>
                <th className="py-1.5 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {subsidiaryRanking.map((row, idx) => (
                <tr key={row.subsidiary.code} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-2 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <div className="font-bold text-slate-900">{row.subsidiary.code}</div>
                    <div className="text-[10px] text-slate-400">{row.subsidiary.hq}</div>
                  </td>
                  <td className="py-2.5 px-2 text-slate-700">{row.mineCount}</td>
                  <td className="py-2.5 px-2 font-semibold text-slate-800">{row.compliance.toFixed(1)}%</td>
                  <td className="py-2.5 px-2 text-slate-700">{row.risk.toFixed(0)}</td>
                  <td className="py-2.5 px-2 text-slate-700">{row.violations}</td>
                  <td className="py-2.5 px-2 text-slate-700">{row.closurePct.toFixed(0)}%</td>
                  <td className="py-2.5 px-2 text-slate-700">{row.inspectionPct.toFixed(0)}%</td>
                  <td className="py-2.5 px-2">
                    <StatusBadge band={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {renderSubsidiaryAiComparison()}

      {/* AI Risk Cards — highest-risk mines (deterministic scores; AI interpretation loads on demand) */}
      <SectionCard title="AI Risk Assessments — Highest Risk Mines" icon={Sparkles} accent="text-[#0B6B4A]" badge="MineMitra AI">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredMineRanking.slice(0, 4).map((row) => {
            const profile = buildMineProfile(row.mine.id, complaints);
            if (!profile) return null;
            return <AIRiskCard key={row.mine.id} profile={profile} onViewFullAnalysis={() => setSelectedAiMineId(row.mine.id)} />;
          })}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 4.2 Mine Risk Ranking */}
        <SectionCard title="Mine Risk Ranking" icon={ShieldAlert} badge={`${filteredMineRanking.length} Mines`}>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredMineRanking.map((row) => (
              <button
                key={row.mine.id}
                onClick={() => onNavigate('gis')}
                className="w-full text-left flex items-center justify-between p-2.5 rounded border border-slate-200 hover:border-[#004D40] hover:bg-emerald-50/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-900 text-xs truncate">{row.mine.name}</span>
                    <StatusBadge band={row.band} />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {row.mine.subsidiary} • {row.mine.area} • Compliance {row.mine.cmrComplianceRate.toFixed(1)}% • {row.violations} active violations
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-sm font-extrabold text-slate-900">{row.score}</div>
                  <div className="text-[9px] text-slate-400 uppercase">Risk score</div>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* 4.2b Suggested Inspection Priority (Step 2) */}
        <SectionCard title="Suggested Inspection Priority" icon={ClipboardCheck} badge={`Top ${inspectionPriorityRanking.length}`}>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {inspectionPriorityRanking.map((row, i) => (
              <button
                key={row.mine.id}
                onClick={() => onNavigate('gis')}
                className="w-full text-left flex items-center justify-between p-2.5 rounded border border-orange-200 hover:border-orange-400 hover:bg-orange-50/50 transition-colors"
              >
                <div className="min-w-0 flex items-start space-x-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate">{row.mine.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{row.inspectionPriorityReason}</div>
                  </div>
                </div>
                <span className="shrink-0 ml-2 text-[10px] font-extrabold px-2 py-0.5 rounded border border-orange-300 bg-orange-100 text-orange-800">
                  Priority {row.inspectionPriority}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Combines risk score, pending inspections, and recurring-violation history into one sortable ranking — not risk score alone.</p>
        </SectionCard>

        {/* 4.3 Compliance Trend */}
        <SectionCard
          title="Compliance Trend"
          icon={TrendingUp}
          badge={undefined}
        >
          <div className="flex items-center space-x-1.5 mb-2">
            {(['7d', '30d', '6m', '1y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setTrendPeriod(p)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                  trendPeriod === p ? 'bg-[#004D40] text-white border-[#004D40]' : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          <TrendLine points={trendSeries.points} labels={trendSeries.labels} />
          <div className="text-[10px] text-slate-400 mt-1">National average CMR compliance % across all {org.totalMines} tracked mines.</div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 4.4 Risk Distribution */}
        <SectionCard title="Risk Distribution" icon={Gauge}>
          <div className="space-y-2.5">
            <MiniBarRow label="Low" value={riskDistribution.Low} max={org.totalMines} color="bg-emerald-600" />
            <MiniBarRow label="Moderate" value={riskDistribution.Moderate} max={org.totalMines} color="bg-yellow-500" />
            <MiniBarRow label="High" value={riskDistribution.High} max={org.totalMines} color="bg-amber-500" />
            <MiniBarRow label="Critical" value={riskDistribution.Critical} max={org.totalMines} color="bg-red-600" />
          </div>
        </SectionCard>

        {/* 4.6 Inspection Performance */}
        <SectionCard title="Inspection Performance" icon={ClipboardCheck}>
          <div className="space-y-2.5">
            <MiniBarRow label="Completed" value={inspectionPerf.completed} max={inspectionPerf.completed + inspectionPerf.pending + inspectionPerf.overdue} color="bg-emerald-600" />
            <MiniBarRow label="Pending" value={inspectionPerf.pending} max={inspectionPerf.completed + inspectionPerf.pending + inspectionPerf.overdue} color="bg-blue-500" />
            <MiniBarRow label="Overdue" value={inspectionPerf.overdue} max={inspectionPerf.completed + inspectionPerf.pending + inspectionPerf.overdue} color="bg-red-600" />
            <div className="pt-1 text-[11px] font-bold text-slate-700">Completion Rate: <span className="text-[#004D40]">{inspectionPerf.pct}%</span></div>
          </div>
        </SectionCard>

        {/* 4.7 Corrective Action Performance */}
        <SectionCard title="Corrective Action Performance" icon={Activity}>
          <div className="space-y-2.5">
            <MiniBarRow label="Open" value={correctivePerf.open} max={correctivePerf.open + correctivePerf.inProgress + correctivePerf.resolved + correctivePerf.overdue} color="bg-slate-500" />
            <MiniBarRow label="In Progress" value={correctivePerf.inProgress} max={correctivePerf.open + correctivePerf.inProgress + correctivePerf.resolved + correctivePerf.overdue} color="bg-blue-500" />
            <MiniBarRow label="Resolved" value={correctivePerf.resolved} max={correctivePerf.open + correctivePerf.inProgress + correctivePerf.resolved + correctivePerf.overdue} color="bg-emerald-600" />
            <MiniBarRow label="Overdue" value={correctivePerf.overdue} max={correctivePerf.open + correctivePerf.inProgress + correctivePerf.resolved + correctivePerf.overdue} color="bg-red-600" />
            <div className="pt-1 text-[11px] font-bold text-slate-700">Closure Rate: <span className="text-[#004D40]">{correctivePerf.closurePct}%</span></div>
          </div>
        </SectionCard>
      </div>

      {/* 4.5 Violation Analytics */}
      <SectionCard title="Violation Analytics" icon={FileWarning} badge={`${violationCategories.unresolved} unresolved`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {violationCategories.rows.map(([type, v]) => (
            <MiniBarRow key={type} label={type} value={v.count} max={Math.max(...violationCategories.rows.map(([, x]) => x.count))} color={v.critical > 0 ? 'bg-red-600' : 'bg-amber-500'} suffix={v.critical > 0 ? ` (${v.critical} critical)` : ''} />
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <strong className="text-slate-700">{violationCategories.recurring}</strong> categories show recurring violations across multiple sites.
        </div>
      </SectionCard>

      {/* 4.8 Critical Alerts */}
      {renderCriticalAlerts()}
    </div>
  );

  const renderCriticalAlerts = () => (
    <SectionCard title="Critical Alerts" icon={ShieldAlert} accent="text-red-700" badge={`${criticalAlerts.length} open`}>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {criticalAlerts.length === 0 && <div className="text-xs text-slate-400 italic">No critical alerts at this time.</div>}
        {criticalAlerts.map((a, i) => (
          <div key={i} className={`flex items-start justify-between p-2.5 rounded border ${a.severity === 'Critical' ? 'bg-red-50/60 border-red-200' : a.severity === 'High' ? 'bg-amber-50/60 border-amber-200' : 'bg-yellow-50/60 border-yellow-200'}`}>
            <div className="min-w-0 pr-3">
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    a.severity === 'Critical' ? 'bg-red-600 text-white' : a.severity === 'High' ? 'bg-amber-500 text-white' : 'bg-yellow-500 text-white'
                  }`}
                >
                  {a.severity}
                </span>
                <span className="text-[11px] font-bold text-slate-900 truncate">{a.mine}</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-snug">{a.issue}</p>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{a.date} • {a.status}</div>
            </div>
            <button
              onClick={a.action}
              className="shrink-0 flex items-center space-x-1 px-2 py-1 bg-slate-900 hover:bg-slate-700 text-white text-[10px] font-bold rounded"
            >
              <Eye className="w-3 h-3" />
              <span>View</span>
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  // -------------------------------------------------------------------------
  // ROLE: REGULATORY AUTHORITY (audit_compliance_officer)
  // -------------------------------------------------------------------------
  const renderRegulatoryAuthority = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile label="Regulatory Compliance" value={`${org.overallCompliance.toFixed(1)}%`} icon={Gauge} />
        <KpiTile label="Statutory Violations" value={org.activeViolations} icon={FileWarning} tone="text-red-700 bg-red-50 border-red-200" />
        <KpiTile label="Overdue Statutory Items" value={org.overdueRegs} icon={AlertTriangle} tone="text-red-700 bg-red-50 border-red-200" />
        <KpiTile label="Unresolved Issues" value={org.openCorrective} icon={Activity} tone="text-amber-700 bg-amber-50 border-amber-200" />
      </div>

      {renderSubsidiaryAiComparison()}

      <SectionCard title="Mine Risk & Regulatory Standing" icon={ShieldAlert} badge={`${mineRiskRanking.length} Mines`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-1.5 px-1">Mine</th>
                <th className="py-1.5 px-1">Subsidiary</th>
                <th className="py-1.5 px-1">Compliance %</th>
                <th className="py-1.5 px-1">Risk</th>
                <th className="py-1.5 px-1">Active Violations</th>
                <th className="py-1.5 px-1">Inspection Status</th>
              </tr>
            </thead>
            <tbody>
              {mineRiskRanking.map((row) => (
                <tr key={row.mine.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-1 font-bold text-slate-900">{row.mine.name}</td>
                  <td className="py-2 px-1 text-slate-600">{row.mine.subsidiary}</td>
                  <td className="py-2 px-1">{row.mine.cmrComplianceRate.toFixed(1)}%</td>
                  <td className="py-2 px-1"><StatusBadge band={row.band} /></td>
                  <td className="py-2 px-1">{row.violations}</td>
                  <td className="py-2 px-1 text-slate-600">{row.mine.pendingInspections} pending</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="National Statutory Register Status" icon={ClipboardCheck}>
        <div className="space-y-2">
          {regulationsFor().map((r) => (
            <div key={r.id} className="flex items-center justify-between p-2 rounded border border-slate-200 text-xs">
              <div className="min-w-0 pr-2">
                <div className="font-bold text-slate-900 truncate">{r.provisionDescription}</div>
                <div className="text-[10px] text-slate-400 font-mono">{r.regulationId} • Due {r.dueDate}</div>
              </div>
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${
                  r.status === 'Overdue'
                    ? 'bg-red-50 text-red-700 border-red-300'
                    : r.status === 'Due <48h'
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                }`}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {renderCriticalAlerts()}
    </div>
  );

  // -------------------------------------------------------------------------
  // ROLE: INSPECTOR / FIELD OFFICER (field_inspector)
  // -------------------------------------------------------------------------
  const renderInspector = () => {
    const assignedMine = MINE_LOCATIONS.find((m) => m.id === activeRoleProfile.mineId) || MINE_LOCATIONS[0];
    const myQueue = complaints.filter((c) => c.currentResponsibleRole === 'field_inspector');
    const observations = escalationsFor(assignedMine.name);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiTile label="Assigned Mine" value={assignedMine.name.split(' ')[0]} icon={Building2} sub={assignedMine.area} />
          <KpiTile label="Pending Inspections" value={myQueue.length} icon={ClipboardCheck} tone="text-blue-700 bg-blue-50 border-blue-200" />
          <KpiTile label="Safety Observations" value={observations.length} icon={ShieldAlert} tone="text-amber-700 bg-amber-50 border-amber-200" />
          <KpiTile label="Pending Actions" value={myQueue.length} icon={Activity} tone="text-amber-700 bg-amber-50 border-amber-200" />
        </div>

        {(() => {
          const profile = buildMineProfile(assignedMine.id, complaints);
          return profile ? (
            <div className="max-w-sm">
              <AIRiskCard profile={profile} onViewFullAnalysis={() => setSelectedAiMineId(assignedMine.id)} />
            </div>
          ) : null;
        })()}

        <SectionCard title="Assigned Mine Snapshot" icon={Building2}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div><span className="text-slate-400 block text-[10px] uppercase">Compliance</span><span className="font-bold text-slate-900">{assignedMine.cmrComplianceRate.toFixed(1)}%</span></div>
            <div><span className="text-slate-400 block text-[10px] uppercase">Risk Tier</span><StatusBadge band={riskBandOf(assignedMine, computeRiskSignals(assignedMine, complaints))} /></div>
            <div><span className="text-slate-400 block text-[10px] uppercase">Pending Inspections</span><span className="font-bold text-slate-900">{assignedMine.pendingInspections}</span></div>
            <div><span className="text-slate-400 block text-[10px] uppercase">Manager</span><span className="font-bold text-slate-900">{assignedMine.firstClassManager}</span></div>
          </div>
        </SectionCard>

        <SectionCard title="Field Activity — Inspection Queue" icon={ClipboardCheck} badge={`${myQueue.length} items`}>
          <div className="space-y-2">
            {myQueue.length === 0 && <div className="text-xs text-slate-400 italic">No items currently pending inspection.</div>}
            {myQueue.map((c) => (
              <button
                key={c.id}
                onClick={() => onNavigate('inspection')}
                className="w-full text-left flex items-center justify-between p-2.5 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-900 text-xs truncate">{c.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{c.trackingNumber} • {c.category}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Safety Observations Feed" icon={Radio}>
          <div className="space-y-2">
            {observations.map((o) => (
              <div key={o.id} className="p-2.5 rounded border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-900">{o.type}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{o.timeAgo}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{o.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // ROLE: MINE OFFICIAL (safety_officer / maintenance_officer) — mine-scoped
  // -------------------------------------------------------------------------
  const renderMineOfficial = () => {
    const mine = MINE_LOCATIONS.find((m) => m.id === activeRoleProfile.mineId) || MINE_LOCATIONS[0];
    const esc = escalationsFor(mine.name);
    const docs = documentsFor(mine.id);
    const mineComplaints = complaints.filter((c) => c.mineId === mine.id);
    const openActions = mineComplaints.filter((c) => c.status !== 'RESOLVED_VERIFIED' && c.status !== 'REJECTED');
    const mineSignals = computeRiskSignals(mine, complaints);
    const mineBand = riskBandOf(mine, mineSignals);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiTile label="Mine Compliance" value={`${mine.cmrComplianceRate.toFixed(1)}%`} icon={Gauge} />
          <KpiTile label="Current Risk" value={mineBand} icon={ShieldAlert} tone={`${bandColor(mineBand).text} ${bandColor(mineBand).bg} ${bandColor(mineBand).border}`} />
          <KpiTile label="Active Violations" value={esc.filter((e) => e.status !== 'Resolved').length} icon={FileWarning} tone="text-red-700 bg-red-50 border-red-200" />
          <KpiTile label="Pending Inspections" value={mine.pendingInspections} icon={ClipboardCheck} tone="text-blue-700 bg-blue-50 border-blue-200" />
        </div>

        {(() => {
          const profile = buildMineProfile(mine.id, complaints);
          return profile ? (
            <div className="max-w-sm">
              <AIRiskCard profile={profile} onViewFullAnalysis={() => setSelectedAiMineId(mine.id)} />
            </div>
          ) : null;
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Corrective Actions" icon={Activity} badge={`${openActions.length} open`}>
            <div className="space-y-2">
              {openActions.length === 0 && <div className="text-xs text-slate-400 italic">No open corrective actions for {mine.name}.</div>}
              {openActions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onNavigate('inspection')}
                  className="w-full text-left flex items-center justify-between p-2.5 rounded border border-slate-200 hover:border-[#004D40] hover:bg-emerald-50/40"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 text-xs truncate">{c.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.trackingNumber} • {c.severity}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Document Status" icon={FileText}>
            <div className="space-y-2">
              {docs.length === 0 && <div className="text-xs text-slate-400 italic">No documents on file for this mine yet.</div>}
              {docs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onNavigate('document-intelligence')}
                  className="w-full text-left flex items-center justify-between p-2.5 rounded border border-slate-200 hover:border-[#0B6B4A] hover:bg-emerald-50/40"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 text-xs truncate">{d.documentType}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{d.referenceNumber} • Expiry {d.expiryDate || 'N/A'}</div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${
                      d.expiryStatus === 'Expired'
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : d.expiryStatus === 'Expiring Soon'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    }`}
                  >
                    {d.expiryStatus}
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Recent Field Observations" icon={Radio}>
          <div className="space-y-2">
            {esc.length === 0 && <div className="text-xs text-slate-400 italic">No recent escalations logged for this mine.</div>}
            {esc.map((o) => (
              <div key={o.id} className="p-2.5 rounded border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-900">{o.type}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      o.severity === 'Critical' ? 'bg-red-600 text-white' : o.severity === 'Warning' ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'
                    }`}
                  >
                    {o.severity}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{o.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  };

  const roleTitle: Record<string, { title: string; sub: string }> = {
    corporate_director: { title: 'Corporate Governance — Executive Command Centre', sub: 'Organization-wide performance across all subsidiaries and mines' },
    audit_compliance_officer: { title: 'Regulatory Governance Overview', sub: 'National statutory compliance & regulatory visibility' },
    field_inspector: { title: 'Field Governance Overview', sub: 'Assigned mine inspections, observations & pending actions' },
    safety_officer: { title: 'Mine Governance Overview', sub: `Governance snapshot for ${activeRoleProfile.mineName}` },
    maintenance_officer: { title: 'Mine Governance Overview', sub: `Governance snapshot for ${activeRoleProfile.mineName}` }
  };

  const header = roleTitle[currentRole] || roleTitle.corporate_director;

  const filterSidebar = (
    <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden h-fit">
      <div className="px-3 py-2.5 bg-[#0B6B4A] text-white flex items-center gap-2">
        <Filter className="w-3.5 h-3.5" />
        <span className="text-xs font-bold uppercase tracking-wide">Refine Analytics</span>
      </div>
      <div className="p-3 space-y-4">
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Search mines</div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-slate-400" />
            <input
              value={mineSearch}
              onChange={(e) => setMineSearch(e.target.value)}
              placeholder="Mine, area or code"
              className="w-full pl-7 pr-2 py-2 text-xs border border-slate-200 rounded-md outline-none focus:border-[#0B6B4A]"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Risk band</span>
            <button onClick={() => setFilterBand('All')} className="text-[10px] font-bold text-[#0B6B4A]">Select All</button>
          </div>
          <div className="space-y-1">
            {(['All', 'Low', 'Moderate', 'High', 'Critical'] as const).map((b) => (
              <label key={b} className="flex items-center gap-2 text-xs text-slate-700">
                <input type="radio" name="riskband" checked={filterBand === b} onChange={() => setFilterBand(b)} />
                {b}
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Subsidiary</div>
          <select
            value={filterSub}
            onChange={(e) => setFilterSub(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-md px-2 py-2 outline-none focus:border-[#0B6B4A]"
          >
            <option value="ALL">All subsidiaries</option>
            {SUBSIDIARIES.map((s) => (
              <option key={s.code} value={s.code}>{s.code}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(['00–06 Early', '06–12 Morning', '12–18 Afternoon', '18–24 Night'] as const).map((slot) => (
            <span key={slot} className="text-[10px] text-center py-2 border border-slate-200 rounded bg-slate-50 text-slate-600">{slot}</span>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="w-full bg-[#F4F7F5] min-h-screen py-4 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-[#0B6B4A]" />
              <h1 className="text-lg font-extrabold text-slate-900">AI Analytics Dashboard</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{header.title} — {header.sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
              {filteredMineRanking.length} mines in view
            </span>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              <span>Live governance layer</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {filterSidebar}
          <div className="flex-1 min-w-0 space-y-4">
            {currentRole === 'corporate_director' && renderCorporateDirector()}
            {/* Step 2 deviation: regulatory_authority previously had no render
                branch here at all (this page's role switch predates the
                Step 1c regulatory_authority role), so it saw a blank
                screen despite being listed in navigationConfig.ts. Reusing
                the read-only, aggregate Corporate Director view closes
                that gap; the dedicated Regulatory Oversight page (Step 1c)
                remains this role's primary, purpose-built destination. */}
            {currentRole === 'regulatory_authority' && renderCorporateDirector()}
            {currentRole === 'audit_compliance_officer' && renderRegulatoryAuthority()}
            {currentRole === 'field_inspector' && renderInspector()}
            {(currentRole === 'safety_officer' || currentRole === 'maintenance_officer') && renderMineOfficial()}
            <AskGovernanceAI />
          </div>
        </div>
      </div>

      {selectedAiMineId &&
        (() => {
          const profile = buildMineProfile(selectedAiMineId, complaints);
          return profile ? <AIAnalysisModal profile={profile} onClose={() => setSelectedAiMineId(null)} /> : null;
        })()}
    </div>
  );
};
