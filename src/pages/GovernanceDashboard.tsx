import React, { useState } from 'react';
import {
  Building2,
  FileText,
  ClipboardCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Search,
  Eye,
  Clock,
  ArrowRight,
  Wrench,
  Shield,
  PlusCircle,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Ruler,
  Stamp,
  Activity,
  Award,
  Radio,
  FileSpreadsheet,
  XCircle,
  Compass
} from 'lucide-react';
import { MINE_LOCATIONS, ESCALATION_FEED, SUBSIDIARIES } from '../data/mockData';
import { PageId, ComplaintItem, AppRole } from '../types';
import { useGovernance } from '../context/GovernanceContext';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import { NewComplaintModal } from '../components/NewComplaintModal';
import { InspectComplaintModal } from '../components/InspectComplaintModal';
import { MaintenanceRepairModal } from '../components/MaintenanceRepairModal';
import { AuditCertifyModal } from '../components/AuditCertifyModal';
import { IndiaEmblem } from '../components/OfficialLogos';
import { ComplianceCategorySummary } from '../components/ComplianceCategorySummary';
import { EscalationWorkflowStepper } from '../components/EscalationWorkflowStepper';

interface GovernanceDashboardProps {
  onNavigate: (page: PageId) => void;
  onSelectMine?: (mineId: string) => void;
}

export const GovernanceDashboard: React.FC<GovernanceDashboardProps> = ({
  onNavigate,
  onSelectMine
}) => {
  const {
    currentRole,
    activeRoleProfile,
    complaints,
    filteredComplaintsForRole,
    unreadNotificationCount,
    setGisFocusComplaintId
  } = useGovernance();

  // Selected complaint modals
  const [selectedDetailComplaint, setSelectedDetailComplaint] = useState<ComplaintItem | null>(null);
  const [inspectingComplaint, setInspectingComplaint] = useState<ComplaintItem | null>(null);
  const [repairingComplaint, setRepairingComplaint] = useState<ComplaintItem | null>(null);
  const [certifyingComplaint, setCertifyingComplaint] = useState<ComplaintItem | null>(null);
  const [isNewComplaintModalOpen, setIsNewComplaintModalOpen] = useState<boolean>(false);

  // Filters for Director view
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // -------------------------------------------------------------
  // HELPER: Lifecycle Stage Visual Pill
  // -------------------------------------------------------------
  const renderStatusBadge = (status: ComplaintItem['status']) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            Stage 1: Logged
          </span>
        );
      case 'PENDING_INSPECTION':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-300 animate-pulse">
            Stage 2: Pending Inspection
          </span>
        );
      case 'ASSIGNED_MAINTENANCE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            Stage 3: In Maintenance
          </span>
        );
      case 'PENDING_AUDIT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-300">
            Stage 4: Pending Audit
          </span>
        );
      case 'RESOLVED_VERIFIED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            Stage 5: DGMS Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-800 border border-red-300">
            Returned to Maintenance
          </span>
        );
    }
  };

  const renderWorkflowProgressBar = (status: ComplaintItem['status']) => {
    const steps = [
      { id: 'SUBMITTED', label: 'Safety' },
      { id: 'PENDING_INSPECTION', label: 'Inspector' },
      { id: 'ASSIGNED_MAINTENANCE', label: 'Workshop' },
      { id: 'PENDING_AUDIT', label: 'Audit' },
      { id: 'RESOLVED_VERIFIED', label: 'DGMS Seal' }
    ];

    const currentIdx = steps.findIndex(s => s.id === status);
    const activeIndex = currentIdx === -1 ? (status === 'REJECTED' ? 2 : 0) : currentIdx;

    return (
      <div className="flex items-center space-x-1">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                idx < activeIndex
                  ? 'bg-emerald-600'
                  : idx === activeIndex
                  ? 'bg-teal-600 ring-2 ring-teal-200 animate-pulse'
                  : 'bg-slate-200'
              }`}
              title={`${step.label}: ${idx <= activeIndex ? 'Completed / Active' : 'Pending'}`}
            />
            {idx < steps.length - 1 && (
              <div
                className={`w-3 sm:w-5 h-0.5 ${
                  idx < activeIndex ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // =============================================================
  // 1. SAFETY OFFICER DASHBOARD VIEW
  // =============================================================
  const renderSafetyOfficerDashboard = () => {
    const mineComplaints = complaints.filter(
      c => c.mineId === activeRoleProfile.mineId || c.submittedBy.officerId === activeRoleProfile.loginId
    );
    const inInspection = mineComplaints.filter(c => c.status === 'PENDING_INSPECTION').length;
    const inRepair = mineComplaints.filter(c => c.status === 'ASSIGNED_MAINTENANCE').length;
    const inAudit = mineComplaints.filter(c => c.status === 'PENDING_AUDIT').length;
    const closed = mineComplaints.filter(c => c.status === 'RESOLVED_VERIFIED').length;

    return (
      <div className="space-y-4">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Mine Hazards
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">{mineComplaints.length}</span>
              <span className="text-xs text-slate-500">Logged in {activeRoleProfile.mineName}</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-600 flex items-center space-x-2">
              <span className="text-blue-700 font-bold">{inInspection} Inspect</span>
              <span>•</span>
              <span className="text-amber-700 font-bold">{inRepair} Repair</span>
              <span>•</span>
              <span className="text-purple-700 font-bold">{inAudit} Audit</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                DGMS Verified & Closed
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-800">{closed}</span>
              <span className="text-xs text-emerald-700 font-semibold">Gazette Certified</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Zero pending compliance notices in Seam IV
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Form B Biometric Muster
              </span>
              <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">98.4%</span>
              <span className="text-xs text-teal-700 font-semibold">Gate Compliant</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              412 Contractual & Regular miners active on Shift A
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pit Environmental Telemetry
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-700">NORMAL</span>
              <span className="text-xs text-slate-500">CH4: 0.18%</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Air Velocity: 34 m/min • Slope Radar: 0.8mm
            </div>
          </div>
        </div>

        {/* Main Operational Hazard Ledger & Contextual Action */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-teal-800" />
                <span>Colliery Hazard Dockets & 5-Stage Lifecycle Tracker</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory tracking under CMR 2017 Reg 34/35. Handover sequence to Field Inspector and Workshop.
              </p>
            </div>

            <button
              onClick={() => setIsNewComplaintModalOpen(true)}
              className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Log Colliery Hazard</span>
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {mineComplaints.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No active hazards logged in this colliery.
              </div>
            ) : (
              mineComplaints.map((c) => (
                <div
                  key={c.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {c.trackingNumber}
                      </span>
                      {renderStatusBadge(c.status)}
                      <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {c.regulationCode}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {c.category} • {c.seamBlock}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center space-x-3 pt-1">
                      <span>Logged: <strong>{c.submittedBy.timestamp}</strong></span>
                      <span>•</span>
                      <span>Responsible Role: <strong className="text-slate-700 uppercase">{c.currentResponsibleRole.replace(/_/g, ' ')}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">
                        LIFECYCLE HANDOVER
                      </span>
                      {renderWorkflowProgressBar(c.status)}
                    </div>

                    <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setGisFocusComplaintId(c.id);
                        onNavigate('gis');
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-[#0B6B4A] rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors border border-emerald-200"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Locate on GIS</span>
                    </button>
                    <button
                      onClick={() => setSelectedDetailComplaint(c)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Docket</span>
                    </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // =============================================================
  // 2. FIELD INSPECTOR DASHBOARD VIEW
  // =============================================================
  const renderFieldInspectorDashboard = () => {
    const pendingInspections = complaints.filter(c => c.status === 'PENDING_INSPECTION');
    const inspectedToday = complaints.filter(c => c.inspectedBy !== undefined).length;

    return (
      <div className="space-y-4">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs bg-blue-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Pending Field Surveys
              </span>
              <div className="p-2 bg-blue-100 text-blue-800 rounded-lg border border-blue-300">
                <ClipboardCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-blue-950">{pendingInspections.length}</span>
              <span className="text-xs text-blue-800 font-semibold">Immediate Triage SLA</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-700">
              Requires on-ground physical measurement & photo validation
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Section 22 Notices
              </span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">0</span>
              <span className="text-xs text-emerald-700 font-semibold">No Stop-Work Orders</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Sub-division operating within CMR compliance bounds
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Field Surveys Completed
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-800">{inspectedToday}</span>
              <span className="text-xs text-emerald-700 font-semibold">Dispatched to Workshop</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Signed with digital DGMS inspector certificate
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Survey Kit & GPS Status
              </span>
              <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-teal-800">RTK LOCK</span>
              <span className="text-xs text-slate-500">+/- 1.2m</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Offline Cache Ready • Camera Geotagging ON
            </div>
          </div>
        </div>

        {/* Priority Field Inspection Docket */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-blue-50/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ClipboardCheck className="w-4 h-4 text-blue-700" />
                <span>Priority Field Inspection Docket (Stage 2)</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                On-site verification queue for DGMS Deputy Field Inspector. Record measured values and issue Maintenance Orders.
              </p>
            </div>
            <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full border border-blue-200 font-mono">
              {pendingInspections.length} PENDING ACTION
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {pendingInspections.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                All reported safety hazards have been inspected and dispatched.
              </div>
            ) : (
              pendingInspections.map((c) => (
                <div
                  key={c.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {c.trackingNumber}
                      </span>
                      <span className="text-[11px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {c.severity} Severity
                      </span>
                      <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {c.regulationCode}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {c.mineName} ({c.seamBlock})
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {c.description}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center space-x-3 pt-1">
                      <span>Submitted By: <strong>{c.submittedBy.name}</strong></span>
                      <span>•</span>
                      <span>Timestamp: <strong>{c.submittedBy.timestamp}</strong></span>
                    </div>
                  </div>

                  {/* Contextual Action Button: 1-Click Inspection */}
                  <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-auto">
                    <button
                      onClick={() => {
                        setGisFocusComplaintId(c.id);
                        onNavigate('gis');
                      }}
                      className="px-3 py-2 bg-white hover:bg-emerald-50 text-[#0B6B4A] rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                    >
                      Locate on GIS
                    </button>
                    <button
                      onClick={() => setSelectedDetailComplaint(c)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200"
                    >
                      Dossier
                    </button>
                    <button
                      onClick={() => setInspectingComplaint(c)}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5"
                    >
                      <Ruler className="w-3.5 h-3.5 text-blue-200" />
                      <span>Inspect & Dispatch Work Order</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // =============================================================
  // 3. MAINTENANCE OFFICER DASHBOARD VIEW
  // =============================================================
  const renderMaintenanceOfficerDashboard = () => {
    const activeWorkOrders = complaints.filter(c => c.status === 'ASSIGNED_MAINTENANCE');
    const completedWorkOrders = complaints.filter(c => c.maintenanceBy !== undefined).length;

    return (
      <div className="space-y-4">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Assigned Work Orders
              </span>
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg border border-amber-300">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-amber-950">{activeWorkOrders.length}</span>
              <span className="text-xs text-amber-800 font-semibold">Stage 3 Repairs</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700">
              Active workshop work orders requiring execution
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Heavy Fleet Availability
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-800">89.4%</span>
              <span className="text-xs text-slate-500">Dumpers & Shovels</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              34 of 38 units operational across Chhal Colliery
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Repairs Completed
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-800">{completedWorkOrders}</span>
              <span className="text-xs text-emerald-700 font-semibold">Sent for Audit</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Average turnaround downtime: 4.8 hours
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Critical Spare Inventory
              </span>
              <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">96.2%</span>
              <span className="text-xs text-slate-500">Stock In-House</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Ballast, brake kits, and hydraulic seals in central store
            </div>
          </div>
        </div>

        {/* Active Work Order Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-amber-50/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-amber-700" />
                <span>HEMM & Civil Remediation Work Orders (Stage 3)</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Dispatched by Field Inspector. Record parts replaced, plant downtime, and send for Chief Audit verification.
              </p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-200 font-mono">
              {activeWorkOrders.length} WORK ORDERS ACTIVE
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {activeWorkOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No outstanding maintenance work orders assigned. Fleet and civil benches in full operational order.
              </div>
            ) : (
              activeWorkOrders.map((c) => (
                <div
                  key={c.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {c.trackingNumber}
                      </span>
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        {c.equipmentId || 'Civil Infrastructure'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700">
                        {c.mineName} • {c.seamBlock}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>

                    {/* Field Inspector's exact finding */}
                    {c.inspectedBy && (
                      <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-xs text-slate-700">
                        <span className="font-bold text-amber-900 block mb-0.5">
                          Field Inspector Directive ({c.inspectedBy.name}):
                        </span>
                        <p className="leading-relaxed">{c.inspectedBy.findings}</p>
                      </div>
                    )}
                  </div>

                  {/* Contextual Action Button: 1-Click Repair */}
                  <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-auto">
                    <button
                      onClick={() => {
                        setGisFocusComplaintId(c.id);
                        onNavigate('gis');
                      }}
                      className="px-3 py-2 bg-white hover:bg-emerald-50 text-[#0B6B4A] rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                    >
                      Locate on GIS
                    </button>
                    <button
                      onClick={() => setSelectedDetailComplaint(c)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200"
                    >
                      Dossier
                    </button>
                    <button
                      onClick={() => setRepairingComplaint(c)}
                      className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-200" />
                      <span>Execute Repair & Forward to Audit</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // =============================================================
  // 4. AUDIT & COMPLIANCE OFFICER DASHBOARD VIEW
  // =============================================================
  const renderAuditOfficerDashboard = () => {
    const pendingAudits = complaints.filter(c => c.status === 'PENDING_AUDIT');
    const certifiedClosures = complaints.filter(c => c.status === 'RESOLVED_VERIFIED').length;

    return (
      <div className="space-y-4">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs bg-indigo-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Pending Statutory Seals
              </span>
              <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg border border-indigo-300">
                <Stamp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-indigo-950">{pendingAudits.length}</span>
              <span className="text-xs text-indigo-800 font-semibold">Stage 4 Final Sign-off</span>
            </div>
            <div className="mt-2 text-[11px] text-indigo-700">
              Awaiting formal DGMS Gazette certificate issue
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Certified Closures
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-800">{certifiedClosures}</span>
              <span className="text-xs text-emerald-700 font-semibold">Sealed with SHA-256</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Legally certified under Coal Mines Regulations 2017
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Circle Compliance Index
              </span>
              <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">96.8%</span>
              <span className="text-xs text-teal-700 font-semibold">Raigarh Circle</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Zero unrectified Section 22 notices
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Mines Act Prosecutions
              </span>
              <div className="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">0</span>
              <span className="text-xs text-slate-500">Nil Active</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              All statutory returns submitted within schedule
            </div>
          </div>
        </div>

        {/* Statutory Verification & DGMS Seal Docket */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Stamp className="w-4 h-4 text-indigo-800" />
                <span>Statutory Verification & DGMS Seal Queue (Stage 4)</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Review complete side-by-side evidence: Initial Hazard → Inspector Findings → Workshop Overhaul. Affix formal DGMS seal.
              </p>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-full border border-indigo-200 font-mono">
              {pendingAudits.length} DOSSIERS TO AUDIT
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {pendingAudits.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                All completed maintenance repairs have been audited and certified under CMR 2017.
              </div>
            ) : (
              pendingAudits.map((c) => (
                <div
                  key={c.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {c.trackingNumber}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {c.regulationCode}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {c.mineName} ({c.seamBlock})
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>

                    {/* Side by side mini summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <span className="text-[10px] font-bold text-blue-900 block mb-0.5">Field Inspection Findings:</span>
                        <p className="text-slate-700 line-clamp-2">{c.inspectedBy?.findings || 'Verified on ground.'}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <span className="text-[10px] font-bold text-amber-900 block mb-0.5">Maintenance Action Taken:</span>
                        <p className="text-slate-700 line-clamp-2">{c.maintenanceBy?.actionTaken || 'Repaired in workshop.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contextual Action: 1-Click DGMS Seal or Reject */}
                  <div className="flex items-center space-x-2.5 shrink-0 self-end lg:self-auto">
                    <button
                      onClick={() => {
                        setGisFocusComplaintId(c.id);
                        onNavigate('gis');
                      }}
                      className="px-3 py-2 bg-white hover:bg-emerald-50 text-[#0B6B4A] rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                    >
                      Locate on GIS
                    </button>
                    <button
                      onClick={() => setSelectedDetailComplaint(c)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200"
                    >
                      Dossier
                    </button>
                    <button
                      onClick={() => setCertifyingComplaint(c)}
                      className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5"
                    >
                      <Stamp className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Certify Compliance (DGMS Seal)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // =============================================================
  // 5. CORPORATE DIRECTOR DASHBOARD VIEW
  // =============================================================
  const renderCorporateDirectorDashboard = () => {
    const totalMines = MINE_LOCATIONS.length;
    const criticalIncidents = complaints.filter(c => c.severity === 'Critical');

    const filteredSubs = selectedSubsidiary === 'ALL'
      ? SUBSIDIARIES
      : SUBSIDIARIES.filter(s => s.code === selectedSubsidiary);

    return (
      <div className="space-y-4">
        {/* Institutional Board Masthead */}
        <div className="bg-[#0B6B4A] text-white p-5 rounded-xl border border-emerald-800 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-2 bg-white/10 rounded-lg border border-white/20">
                <IndiaEmblem size={34} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest block">
                  Apex Board Oversight • Coal India Ltd & Ministry of Coal
                </span>
                <h2 className="text-lg font-black text-white">
                  Pan-India Statutory Mine Safety & Corporate Governance Matrix
                </h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Real-time aggregation across 8 subsidiaries, 377 producing mines, and 84,000+ active workforce.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-emerald-100">Filter Subsidiary:</span>
              <select
                value={selectedSubsidiary}
                onChange={(e) => setSelectedSubsidiary(e.target.value)}
                className="bg-white text-slate-800 border border-emerald-200 text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-emerald-400"
              >
                <option value="ALL">All 8 Subsidiaries (CIL Total)</option>
                {SUBSIDIARIES.map(s => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* National Macro KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              National CMR Compliance
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-800">94.6%</span>
              <span className="text-xs text-emerald-700 font-semibold">+1.2% MoM</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Statutory verification rate under DGMS Gazette
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Active Producing Mines
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">377</span>
              <span className="text-xs text-slate-500">Across 8 Subsidiaries</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              214 Opencast • 146 Underground • 17 Mixed
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Critical Escalations
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-amber-700">{criticalIncidents.length}</span>
              <span className="text-xs text-amber-800 font-semibold">Priority 1</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Zero fatal accidents reported in active shift
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Form B Biometric Muster
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-teal-800">97.8%</span>
              <span className="text-xs text-slate-500">Aadhaar Linked</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              84,120 miners mustered at turnstiles today
            </div>
          </div>
        </div>

        {/* 8-Subsidiary Performance Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-800" />
              <span>Coal India Subsidiary Statutory Safety Performance Matrix</span>
            </h3>
            <span className="text-xs text-slate-500">Live CIL Intranet Sync</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Subsidiary</th>
                  <th className="py-3 px-4">Headquarters</th>
                  <th className="py-3 px-4">Operating Mines</th>
                  <th className="py-3 px-4">CMR Compliance</th>
                  <th className="py-3 px-4">Active Inspections</th>
                  <th className="py-3 px-4">Open Violations</th>
                  <th className="py-3 px-4">Workforce Tracked</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSubs.map((sub) => {
                  const complianceRate = sub.code === 'SECL' ? 96.4 : sub.code === 'BCCL' ? 92.1 : sub.code === 'CCL' ? 94.8 : 95.2;
                  const mineCount = sub.code === 'SECL' ? 67 : sub.code === 'BCCL' ? 44 : sub.code === 'CCL' ? 52 : 38;

                  return (
                    <tr key={sub.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {sub.name} <span className="text-slate-500 font-normal">({sub.code})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{sub.hq}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{mineCount} Mines</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-emerald-800 font-mono">{complianceRate}%</span>
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${complianceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-blue-800 font-bold">
                        {sub.code === 'SECL' ? 4 : sub.code === 'BCCL' ? 2 : 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-800 font-bold">
                        {sub.code === 'BCCL' ? 1 : 0}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {sub.code === 'SECL' ? '18,400' : sub.code === 'BCCL' ? '14,200' : '11,800'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigate('gis')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] border border-slate-200"
                        >
                          View GIS
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statutory Escalation Visual Stepper (Level 1-5 / 8 Stages) */}
        <EscalationWorkflowStepper escalationItem={ESCALATION_FEED[0]} />

        {/* National Critical Escalation Feed & Traceability Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Critical Statutory Escalations Feed</span>
            </h3>
            <div className="space-y-3">
              {complaints.slice(0, 3).map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{c.trackingNumber}</span>
                    {renderStatusBadge(c.status)}
                  </div>
                  <p className="text-xs font-medium text-slate-700">{c.title}</p>
                  <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                    <span>{c.mineName}</span>
                    <span>{c.submittedBy.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-teal-800" />
              <span>Immutable Chain-of-Custody & Audit Verifications</span>
            </h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Every transition in the 5-stage lifecycle is cryptographically hashed with SHA-256 and stored in the tamper-evident government ledger.
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-950 block">DGMS Receipt #DGMS-BCCL-CH4-2026-0881</span>
                  <span className="text-[11px] text-emerald-800">Moonidih Deep Shaft • Gas Telemetry Verified</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                  SEALED
                </span>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-950 block">DGMS Receipt #DGMS-SECL-BM-2026-0419</span>
                  <span className="text-[11px] text-emerald-800">Chhal Opencast Mine • Haul Road Berm Overhaul</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                  SEALED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#F4F7F5] min-h-screen py-4 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Statutory 4-Pillar Compliance Summary */}
        <ComplianceCategorySummary />

        {/* Dynamic Role-Tailored Dashboard View */}
        {currentRole === 'safety_officer' && renderSafetyOfficerDashboard()}
        {currentRole === 'field_inspector' && renderFieldInspectorDashboard()}
        {currentRole === 'maintenance_officer' && renderMaintenanceOfficerDashboard()}
        {currentRole === 'audit_compliance_officer' && renderAuditOfficerDashboard()}
        {(currentRole === 'corporate_director' || currentRole === 'regulatory_authority') && renderCorporateDirectorDashboard()}
      </div>

      {/* Global Interactive Workflow Modals */}
      {selectedDetailComplaint && (
        <ComplaintDetailModal
          complaint={selectedDetailComplaint}
          isOpen={!!selectedDetailComplaint}
          onClose={() => setSelectedDetailComplaint(null)}
        />
      )}

      {inspectingComplaint && (
        <InspectComplaintModal
          complaint={inspectingComplaint}
          isOpen={!!inspectingComplaint}
          onClose={() => setInspectingComplaint(null)}
        />
      )}

      {repairingComplaint && (
        <MaintenanceRepairModal
          complaint={repairingComplaint}
          isOpen={!!repairingComplaint}
          onClose={() => setRepairingComplaint(null)}
        />
      )}

      {certifyingComplaint && (
        <AuditCertifyModal
          complaint={certifyingComplaint}
          isOpen={!!certifyingComplaint}
          onClose={() => setCertifyingComplaint(null)}
        />
      )}

      {isNewComplaintModalOpen && (
        <NewComplaintModal
          isOpen={isNewComplaintModalOpen}
          onClose={() => setIsNewComplaintModalOpen(false)}
        />
      )}
    </div>
  );
};
