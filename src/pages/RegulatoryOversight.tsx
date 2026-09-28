import React, { useMemo, useState } from 'react';
import {
  Landmark,
  ShieldAlert,
  Building2,
  FileWarning,
  ClipboardCheck,
  Download,
  Eye,
  ChevronRight,
  Gauge,
  Users,
  FileText,
  Lock,
  Loader2
} from 'lucide-react';
import {
  MINE_LOCATIONS,
  ESCALATION_FEED,
  DOCUMENT_RECORDS,
  STATUTORY_REGULATIONS,
  CONTRACTOR_RECORDS,
  SUBSIDIARIES
} from '../data/mockData';
import { useGovernance } from '../context/GovernanceContext';
import { riskBandOf, riskBandTone, RiskBand } from '../lib/riskEngine';
import { computeRiskSignals } from '../lib/mineProfile';
import { EscalationWorkflowStepper } from '../components/EscalationWorkflowStepper';
import { ComplianceCategorySummary } from '../components/ComplianceCategorySummary';
import { PageId } from '../types';

interface RegulatoryOversightProps {
  onNavigate?: (page: PageId) => void;
}

/**
 * Step 1c — Regulatory Authority read-only oversight dashboard.
 *
 * This is the dedicated, purpose-built destination for the external
 * 'regulatory_authority' role: aggregated compliance status, critical/open
 * violations, inspection history, corrective-action status, evidence
 * references, and an exportable summary report — filtered to what a
 * regulator would legitimately see. Deliberately excludes raw commercial/
 * contractor-internal data (vendor rates, contract values); contractor
 * standing is shown only as aggregate compliance counts.
 *
 * Every element on this page is display-only. No button here creates,
 * assigns, resolves, or edits anything — that's the point of the role.
 */
export const RegulatoryOversight: React.FC<RegulatoryOversightProps> = ({ onNavigate }) => {
  const { complaints } = useGovernance();
  const [exporting, setExporting] = useState(false);

  const mineRows = useMemo(() => {
    return MINE_LOCATIONS.map((m) => {
      const signals = computeRiskSignals(m, complaints);
      const band = riskBandOf(m, signals);
      const esc = ESCALATION_FEED.filter((e) => e.mineName === m.name);
      return {
        mine: m,
        band,
        activeViolations: esc.filter((e) => e.status === 'Open' || e.status === 'Under Rectification').length,
        criticalViolations: esc.filter((e) => e.severity === 'Critical').length
      };
    }).sort((a, b) => b.criticalViolations - a.criticalViolations);
  }, [complaints]);

  // Only escalations that have reached senior-management/regulator visibility
  // levels (Step 1d chain: ... -> Senior Management (4) -> Regulator (5)).
  const regulatorEscalations = useMemo(
    () => ESCALATION_FEED.filter((e) => e.level >= 4).sort((a, b) => b.level - a.level),
    []
  );
  const regulatorNotifiedItem = regulatorEscalations.find((e) => e.level === 5) || regulatorEscalations[0];

  const overdueRegulations = STATUTORY_REGULATIONS.filter((r) => r.status === 'Overdue');
  const expiredDocuments = DOCUMENT_RECORDS.filter((d) => d.expiryStatus === 'Expired');

  // Contractor standing shown as aggregate counts only — no vendor names,
  // rates, or other commercial/contractor-internal detail surfaced here.
  const contractorAggregate = useMemo(() => {
    const total = CONTRACTOR_RECORDS.length;
    const withOpenViolations = CONTRACTOR_RECORDS.filter((c: any) => (c.openViolations || 0) > 0).length;
    const suspended = CONTRACTOR_RECORDS.filter((c: any) => c.complianceStatus === 'Work Suspended').length;
    return { total, withOpenViolations, compliant: total - withOpenViolations, suspended };
  }, []);

  const nationalCompliance = Math.round(
    (MINE_LOCATIONS.reduce((s, m) => s + m.cmrComplianceRate, 0) / MINE_LOCATIONS.length) * 10
  ) / 10;
  const criticalMineCount = mineRows.filter((r) => r.band === 'Critical').length;

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert('Read-only Regulatory Compliance Summary exported (PDF) — aggregated national data only, no internal commercial records included.');
    }, 1200);
  };

  const bandBadge = (band: RiskBand) => {
    const tone = riskBandTone(band);
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tone.bg} ${tone.text} ${tone.border}`}>{band}</span>;
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header + visible read-only banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#004D40] uppercase tracking-wider mb-1">
            <Landmark className="w-4 h-4" />
            <span>Regulatory Oversight — National Compliance View</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Ministry of Coal / DGMS Regulatory Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated across {MINE_LOCATIONS.length} mines, {SUBSIDIARIES.length} subsidiaries. Commercial/contractor-internal records are excluded from this view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
            <Lock className="w-3.5 h-3.5" />
            <span>READ-ONLY REGULATORY VIEW</span>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-3 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{exporting ? 'Preparing PDF...' : 'Export Compliance Report'}</span>
          </button>
        </div>
      </div>

      {/* National KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase">National Compliance</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{nationalCompliance}%</div>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-3">
          <div className="text-[10px] font-bold text-red-500 uppercase">Critical-Risk Mines</div>
          <div className="text-2xl font-extrabold text-red-700 mt-1">{criticalMineCount}</div>
        </div>
        <div className="bg-white border border-amber-200 rounded-lg p-3">
          <div className="text-[10px] font-bold text-amber-600 uppercase">Overdue Statutory Filings</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{overdueRegulations.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Regulator-Level Escalations</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{regulatorEscalations.length}</div>
        </div>
      </div>

      {/* Four-pillar compliance summary (reused from Step 1b) */}
      <ComplianceCategorySummary />

      {/* Escalation chain for items that reached senior-management / regulator level */}
      {regulatorNotifiedItem && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-1.5 mb-3">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {regulatorNotifiedItem.level === 5 ? 'Violation Escalated to Regulatory Authority' : 'Escalation Nearing Regulator Notification'}
            </h3>
          </div>
          <div className="text-xs text-slate-600 mb-3">
            {regulatorNotifiedItem.mineName} ({regulatorNotifiedItem.subsidiary}) — {regulatorNotifiedItem.description}
          </div>
          <EscalationWorkflowStepper escalationItem={regulatorNotifiedItem} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mine compliance status — display-only, no action buttons */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-1.5 mb-3">
            <Building2 className="w-4 h-4 text-[#004D40]" />
            <h3 className="text-sm font-bold text-slate-900">Mine Compliance Status</h3>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {mineRows.map((row) => (
              <div key={row.mine.id} className="flex items-center justify-between p-2.5 rounded border border-slate-200">
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-900 text-xs truncate">{row.mine.name}</span>
                    {bandBadge(row.band)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {row.mine.subsidiary} • {row.activeViolations} active violation{row.activeViolations === 1 ? '' : 's'} • {row.criticalViolations} critical
                  </div>
                </div>
                <Eye className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Corrective-action / statutory + contractor + evidence summary */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-1.5 mb-3">
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Corrective-Action &amp; Statutory Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Open Complaints (all mines)</span>
                <span className="font-bold text-slate-900">{complaints.filter((c) => c.status !== 'RESOLVED_VERIFIED' && c.status !== 'REJECTED').length}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Resolved &amp; Verified</span>
                <span className="font-bold text-slate-900">{complaints.filter((c) => c.status === 'RESOLVED_VERIFIED').length}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Expired Statutory Documents</span>
                <span className="font-bold text-red-700">{expiredDocuments.length}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Overdue Regulations</span>
                <span className="font-bold text-amber-700">{overdueRegulations.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-1.5 mb-3">
              <Users className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">Contractor/MDO Compliance (Aggregate)</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Total Registered</span>
                <span className="font-bold text-slate-900">{contractorAggregate.total}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Compliant</span>
                <span className="font-bold text-emerald-700">{contractorAggregate.compliant}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Open Violations</span>
                <span className="font-bold text-red-700">{contractorAggregate.withOpenViolations}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Vendor names, rates, and other commercial detail are intentionally excluded from this regulator view.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-1.5 mb-3">
              <FileText className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">Evidence References — Expired Documents</h3>
            </div>
            {expiredDocuments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No expired statutory documents currently on record.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {expiredDocuments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-[11px] p-2 rounded border border-red-100 bg-red-50/50">
                    <div className="min-w-0">
                      <div className="font-bold text-red-800 truncate">{d.documentType} — {d.referenceNumber}</div>
                      <div className="text-red-600/80 font-mono">{d.mineName} • Issued by {d.issuingAuthority}</div>
                    </div>
                    <FileWarning className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center pt-2">
        This dashboard is strictly read-only. No corrective action, complaint, or contractor status can be created, assigned, or modified from this view.
      </p>
    </div>
  );
};
