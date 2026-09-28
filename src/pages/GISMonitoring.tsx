import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Filter,
  RotateCcw,
  MapPin,
  Crosshair,
  Satellite,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { PageId, ComplaintItem, ComplaintStatus, AppRole } from '../types';
import { RealMineMap, RealMineMapHandle, LIFECYCLE_PIN_COLOR } from '../components/RealMineMap';
import { MineMapPoint } from '../data/mineMapPoints';
import { useGovernance, OFFICIAL_ROLE_PROFILES } from '../context/GovernanceContext';
import { isValidGps } from '../lib/geo';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import { Z_INDEX } from '../config/zIndex';
import { MINE_LOCATIONS } from '../data/mockData';
import { isComplaintRelevantToRole, buildRolePinDetails } from '../lib/roleVisibility';

interface GISMonitoringProps {
  onNavigate?: (page: PageId) => void;
}

const STATUS_LABEL: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Submitted',
  PENDING_INSPECTION: 'Pending Inspection',
  ASSIGNED_MAINTENANCE: 'Assigned Maintenance',
  PENDING_AUDIT: 'Pending Audit',
  RESOLVED_VERIFIED: 'Resolved',
  REJECTED: 'Returned to Maintenance'
};

function pinStatus(c: ComplaintItem): MineMapPoint['status'] {
  if (c.status === 'RESOLVED_VERIFIED') return 'safe';
  if (c.severity === 'Critical' || c.status === 'PENDING_INSPECTION') return 'critical';
  return 'observation';
}

function toMapPoint(c: ComplaintItem, role: AppRole): MineMapPoint | null {
  if (c.locationUnavailable || !isValidGps(c.gpsLocation)) return null;
  // Real per-mine CMR compliance rate (was hardcoded to 0) — needed so
  // Director/Audit/DGMS pin views can show an actual "Compliance %".
  const mine = MINE_LOCATIONS.find((m) => m.id === c.mineId);
  const complianceRate = mine?.cmrComplianceRate ?? 0;
  const assignedOfficerName = OFFICIAL_ROLE_PROFILES[c.currentResponsibleRole]?.name || '—';
  return {
    id: c.id,
    complaintId: c.id,
    trackingNumber: c.trackingNumber,
    mineName: c.mineName,
    subsidiary: c.subsidiary,
    area: c.seamBlock,
    type: c.category,
    riskTier: c.severity === 'Low' ? 'Low' : c.severity === 'Medium' ? 'Medium' : 'High',
    dgmsAuditScore: c.aiInsight?.riskScore ?? 0,
    cmrComplianceRate: complianceRate,
    pendingInspections: 0,
    activeManpower: 0,
    firstClassManager: c.submittedBy.name,
    lat: c.gpsLocation.lat,
    lng: c.gpsLocation.lng,
    status: pinStatus(c),
    pinColor: LIFECYCLE_PIN_COLOR[c.status] || '#0B6B4A',
    title: c.title,
    benchSector: c.seamBlock,
    inspectorName: c.inspectedBy?.name || '—',
    timestamp: c.submittedBy.timestamp,
    observation: c.description,
    violationCode: c.regulationCode,
    severityText: c.severity,
    actionPlan: c.aiInsight?.suggestedMitigation || 'Follow statutory lifecycle.',
    category: c.category,
    severity: c.severity,
    lifecycleLabel: STATUS_LABEL[c.status],
    reportedAt: c.submittedBy.timestamp,
    detailRows: buildRolePinDetails(c, role, complianceRate, assignedOfficerName)
  };
}

export const GISMonitoring: React.FC<GISMonitoringProps> = ({ onNavigate }) => {
  const mapRef = useRef<RealMineMapHandle>(null);
  const { complaints, currentRole, activeRoleProfile, setActiveComplaintDetail, gisFocusComplaintId, setGisFocusComplaintId } = useGovernance();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'satellite' | 'hybrid' | 'street'>('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterMine, setFilterMine] = useState<string>('All');
  const [search, setSearch] = useState('');

  const scopedComplaints = useMemo(() => {
    // corporate_director (all mines) and regulatory_authority (pan-India
    // oversight — its profile's mineId is a placeholder 'ALL_MINES' that
    // never matches a real complaint, so it must be scoped org-wide here
    // too, same as everywhere else in the app) both see every mine's pins.
    const mineScoped = (currentRole === 'corporate_director' || currentRole === 'regulatory_authority')
      ? complaints
      : complaints.filter((c) => c.mineId === activeRoleProfile.mineId);
    // Then narrow to what's actually relevant to this role's queue (e.g.
    // Field Inspector -> pending-inspection pins only, Maintenance Officer
    // -> assigned-maintenance pins only). See src/lib/roleVisibility.ts.
    return mineScoped.filter((c) => isComplaintRelevantToRole(c, currentRole));
  }, [complaints, currentRole, activeRoleProfile.mineId]);

  const mines = useMemo(() => Array.from(new Set(scopedComplaints.map((c) => c.mineName))), [scopedComplaints]);
  const categories = useMemo(() => Array.from(new Set(scopedComplaints.map((c) => c.category))), [scopedComplaints]);

  const filteredComplaints = useMemo(() => {
    return scopedComplaints.filter((c) => {
      if (search && !`${c.trackingNumber} ${c.title} ${c.mineName}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== 'All' && c.status !== filterStatus) return false;
      if (filterRisk !== 'All' && c.severity !== filterRisk) return false;
      if (filterType !== 'All' && c.category !== filterType) return false;
      if (filterMine !== 'All' && c.mineName !== filterMine) return false;
      return true;
    });
  }, [scopedComplaints, search, filterStatus, filterRisk, filterType, filterMine]);

  const visiblePoints = useMemo(
    () => filteredComplaints.map((c) => toMapPoint(c, currentRole)).filter((p): p is MineMapPoint => p !== null),
    [filteredComplaints, currentRole]
  );
  const unavailable = useMemo(() => filteredComplaints.filter((c) => c.locationUnavailable || !isValidGps(c.gpsLocation)), [filteredComplaints]);
  const selectedComplaint = scopedComplaints.find((c) => c.id === selectedId) || null;
  const detailComplaint = complaints.find((c) => c.id === detailId) || null;

  useEffect(() => {
    if (!gisFocusComplaintId) return;
    setSelectedId(gisFocusComplaintId);
    setGisFocusComplaintId(null);
  }, [gisFocusComplaintId, setGisFocusComplaintId]);

  const resetFilters = () => {
    setFilterStatus('All');
    setFilterRisk('All');
    setFilterType('All');
    setFilterMine('All');
    setSearch('');
    setSelectedId(null);
    setFitTrigger((t) => t + 1);
  };

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-[#F4F7F5] py-3 px-3 sm:px-6 flex flex-col overflow-y-auto' : 'w-full bg-[#F4F7F5] min-h-screen py-3 px-3 sm:px-6 flex flex-col'}>
      <div className="max-w-7xl mx-auto w-full space-y-3 flex-1 flex flex-col">
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setMapMode('satellite')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold ${mapMode === 'satellite' ? 'bg-[#0B6B4A] text-white' : 'text-slate-700 hover:bg-slate-200/60'}`}>
                <Satellite className="w-3.5 h-3.5" /><span>Satellite</span>
              </button>
              <button onClick={() => setMapMode('hybrid')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold ${mapMode === 'hybrid' ? 'bg-[#0B6B4A] text-white' : 'text-slate-700 hover:bg-slate-200/60'}`}>
                <Globe className="w-3.5 h-3.5" /><span>Hybrid</span>
              </button>
              <button onClick={() => setMapMode('street')} className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold ${mapMode === 'street' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200/60'}`}>
                <MapPin className="w-3.5 h-3.5" /><span>Street Map</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search complaint ID or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:border-[#0B6B4A] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-0.5 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" /><span>Filters:</span>
            </span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-[11px] border border-slate-300 rounded px-1.5 py-1 bg-white">
              <option value="All">All Statuses</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="text-[11px] border border-slate-300 rounded px-1.5 py-1 bg-white">
              <option value="All">All Risk</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-[11px] border border-slate-300 rounded px-1.5 py-1 bg-white">
              <option value="All">All Hazard Types</option>
              {categories.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterMine} onChange={(e) => setFilterMine(e.target.value)} className="text-[11px] border border-slate-300 rounded px-1.5 py-1 bg-white">
              <option value="All">All Mines</option>
              {mines.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={resetFilters} className="flex items-center space-x-1 px-2 py-1 text-[11px] font-semibold text-slate-600 border border-slate-300 rounded bg-white hover:bg-slate-50">
              <RotateCcw className="w-3 h-3" /><span>Reset</span>
            </button>
            <span className="ml-auto text-[10px] text-slate-400 font-mono">
              {visiblePoints.length} pins · {unavailable.length} location unavailable
            </span>
          </div>
        </div>

        <div className="relative bg-slate-900 border border-slate-300 rounded-lg shadow-sm flex-1 min-h-[540px] overflow-hidden flex">
          <div className="w-full sm:w-80 bg-white border-r border-slate-200 overflow-y-auto shrink-0" style={{ zIndex: Z_INDEX.mapOverlay }}>
            <div className="px-3 py-2 border-b border-slate-200 bg-[#0B6B4A] text-white text-xs font-bold uppercase tracking-wide">
              Complaint register
            </div>
            {filteredComplaints.map((c) => {
              const hasGps = isValidGps(c.gpsLocation) && !c.locationUnavailable;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    if (hasGps) setSelectedId(c.id);
                  }}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-100 hover:bg-emerald-50/60 ${selectedId === c.id ? 'bg-emerald-50 border-l-4 border-l-[#0B6B4A]' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#0B6B4A]">{c.trackingNumber}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${LIFECYCLE_PIN_COLOR[c.status]}22`, color: LIFECYCLE_PIN_COLOR[c.status] }}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 mt-0.5 line-clamp-2">{c.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{c.mineName} · {c.severity}</div>
                  {!hasGps && (
                    <div className="mt-1 text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Location unavailable
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* `isolate` gives Leaflet's own internal panes (which can go up
              to z-index 1000) a local stacking context, so they can never
              leak above this container onto the rest of the page — see
              Z_INDEX comments in config/zIndex.ts. */}
          <div className="flex-1 relative isolate overflow-hidden bg-[#1e293b]">
            <RealMineMap
              ref={mapRef}
              points={visiblePoints}
              selectedId={selectedId}
              onSelect={(p) => setSelectedId(p.id)}
              onViewComplaint={(id) => {
                setDetailId(id);
                setActiveComplaintDetail(complaints.find((c) => c.id === id) || null);
              }}
              mapMode={mapMode}
              zoomTrigger={fitTrigger}
            />

            <div className="absolute top-3 left-3 bg-white/95 border border-slate-200 rounded-lg p-2.5 text-xs shadow-lg pointer-events-none" style={{ zIndex: Z_INDEX.mapOverlay }}>
              <div className="font-bold mb-1.5 text-[#0B6B4A] text-[11px]">LIFECYCLE PINS</div>
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500" /><span>Submitted</span></div>
                <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /><span>Pending Inspection</span></div>
                <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-600" /><span>Assigned Maintenance</span></div>
                <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-600" /><span>Pending Audit</span></div>
                <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600" /><span>Resolved</span></div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col space-y-2" style={{ zIndex: Z_INDEX.mapOverlay }}>
              <div className="bg-white rounded-lg shadow-md border border-slate-300 overflow-hidden flex flex-col">
                <button onClick={() => mapRef.current?.zoomIn()} className="p-2 hover:bg-slate-100 text-slate-700 border-b border-slate-200"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={() => mapRef.current?.zoomOut()} className="p-2 hover:bg-slate-100 text-slate-700 border-b border-slate-200"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => mapRef.current?.fitAll()} className="p-2 hover:bg-slate-100 text-slate-700 border-b border-slate-200"><Crosshair className="w-4 h-4" /></button>
                <button onClick={() => { setIsFullscreen((f) => !f); mapRef.current?.invalidateSize(); }} className="p-2 hover:bg-slate-100 text-slate-700"><Maximize2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {selectedComplaint && (
            <div className="hidden lg:flex w-80 bg-white border-l border-slate-300 p-4 overflow-y-auto flex-col" style={{ zIndex: Z_INDEX.mapOverlay }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-[10px] font-bold text-[#0B6B4A]">{selectedComplaint.trackingNumber}</div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedComplaint.title}</h3>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
              </div>
              <div className="text-xs space-y-2">
                <div><span className="text-slate-500">Mine</span><div className="font-semibold">{selectedComplaint.mineName}</div></div>
                <div><span className="text-slate-500">Category</span><div className="font-semibold">{selectedComplaint.category}</div></div>
                <div><span className="text-slate-500">Risk</span><div className="font-semibold">{selectedComplaint.severity}</div></div>
                <div><span className="text-slate-500">Status</span><div className="font-semibold">{STATUS_LABEL[selectedComplaint.status]}</div></div>
                <div><span className="text-slate-500">Reported</span><div className="font-semibold">{selectedComplaint.submittedBy.timestamp}</div></div>
                {(() => {
                  const mine = MINE_LOCATIONS.find((m) => m.id === selectedComplaint.mineId);
                  const rows = buildRolePinDetails(
                    selectedComplaint,
                    currentRole,
                    mine?.cmrComplianceRate ?? 0,
                    OFFICIAL_ROLE_PROFILES[selectedComplaint.currentResponsibleRole]?.name || '—'
                  );
                  if (rows.length === 0) return null;
                  return (
                    <div className="pt-1 border-t border-slate-100 space-y-1.5">
                      {rows.map((r) => (
                        <div key={r.label}><span className="text-slate-500">{r.label}</span><div className="font-semibold">{r.value}</div></div>
                      ))}
                    </div>
                  );
                })()}
                {isValidGps(selectedComplaint.gpsLocation) ? (
                  <div className="font-mono text-[#0B6B4A]">{selectedComplaint.gpsLocation.lat.toFixed(6)}°N, {selectedComplaint.gpsLocation.lng.toFixed(6)}°E</div>
                ) : (
                  <div className="text-amber-700 font-semibold">Location unavailable</div>
                )}
              </div>
              <button
                onClick={() => setDetailId(selectedComplaint.id)}
                className="mt-4 w-full py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded"
              >
                View Complaint
              </button>
              {onNavigate && (
                <button onClick={() => onNavigate('dashboard')} className="mt-2 w-full py-2 bg-slate-100 text-slate-800 text-xs font-semibold rounded">
                  Open operations desk
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {detailComplaint && (
        <ComplaintDetailModal
          complaint={detailComplaint}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
};
