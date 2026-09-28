import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  UserCheck,
  Wrench,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  Camera,
  Upload,
  Fingerprint,
  Building2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  Layers,
  RotateCcw
} from 'lucide-react';
import { ComplaintItem, MediaAttachment } from '../types';
import { useGovernance, OFFICIAL_ROLE_PROFILES } from '../context/GovernanceContext';

interface ComplaintDetailModalProps {
  complaint: ComplaintItem;
  onClose: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({ complaint, onClose }) => {
  const {
    currentRole,
    activeRoleProfile,
    inspectComplaint,
    completeMaintenance,
    certifyAuditCompliance,
    createSignedMediaAttachment
  } = useGovernance();

  // Field Inspector Form State
  const [inspectorFindings, setInspectorFindings] = useState<string>(
    complaint.inspectedBy?.findings ||
      'On-ground physical survey completed. Measured structural deviation against DGMS CMR regulations.'
  );
  const [requiresMaintenance, setRequiresMaintenance] = useState<boolean>(true);
  const [measuredKey, setMeasuredKey] = useState<string>('Berm Height Measured');
  const [measuredVal, setMeasuredVal] = useState<string>('0.95 m (Mandatory: 2.2m)');

  // Maintenance Officer Form State
  const [maintenanceAction, setMaintenanceAction] = useState<string>(
    complaint.maintenanceBy?.actionTaken ||
      'Deployed motor grader RG-12 and heavy dozer to reconstruct parapet berm to 2.3m height using rock-boulder core.'
  );
  const [partsReplaced, setPartsReplaced] = useState<string>(
    complaint.maintenanceBy?.partsReplaced || 'Rock fill ballast (120 MT), Parapet warning reflector beacons (x8)'
  );
  const [downtimeHours, setDowntimeHours] = useState<number>(complaint.maintenanceBy?.hoursDowntime || 12);

  // Audit Officer Form State
  const [auditRemarks, setAuditRemarks] = useState<string>(
    complaint.auditVerifiedBy?.remarks ||
      'Inspected field restoration evidence against CMR 2017 standards. Verified geometric compliance and dynamic safety load clearance.'
  );
  const [dgmsReceiptNumber, setDgmsReceiptNumber] = useState<string>(
    complaint.auditVerifiedBy?.dgmsReceiptNumber || `DGMS-VERIF-2026-${Math.floor(10000 + Math.random() * 90000)}`
  );

  // Upload attachment state
  const [actionMedia, setActionMedia] = useState<MediaAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'timeline'>('details');

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isMyTurn = complaint.currentResponsibleRole === currentRole;

  const handleSimulatedMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const attachment = await createSignedMediaAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: URL.createObjectURL(file),
        fileObject: file
      });
      setActionMedia(prev => [...prev, attachment]);
    }
  };

  const handleFieldInspectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    inspectComplaint(complaint.id, {
      findings: inspectorFindings,
      measurements: { [measuredKey]: measuredVal },
      requiresMaintenance,
      media: actionMedia
    });
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    completeMaintenance(complaint.id, {
      actionTaken: maintenanceAction,
      partsReplaced,
      hoursDowntime: Number(downtimeHours),
      media: actionMedia
    });
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  const handleAuditSubmit = (isApproved: boolean) => {
    setIsSubmitting(true);
    certifyAuditCompliance(complaint.id, {
      remarks: auditRemarks,
      dgmsReceiptNumber,
      isApproved,
      media: actionMedia
    });
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  const getStatusBadge = (status: ComplaintItem['status']) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 text-xs px-2.5 py-0.5 rounded font-bold">1. SUBMITTED</span>;
      case 'PENDING_INSPECTION':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-xs px-2.5 py-0.5 rounded font-bold">2. PENDING INSPECTION</span>;
      case 'ASSIGNED_MAINTENANCE':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-0.5 rounded font-bold">3. ASSIGNED MAINTENANCE</span>;
      case 'PENDING_AUDIT':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 text-xs px-2.5 py-0.5 rounded font-bold">4. PENDING AUDIT VERIFICATION</span>;
      case 'RESOLVED_VERIFIED':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-0.5 rounded font-bold">5. RESOLVED &amp; VERIFIED</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-800 border border-red-300 text-xs px-2.5 py-0.5 rounded font-bold">DEFICIENT (REJECTED)</span>;
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complaint-detail-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* 1. Modal Top Bar */}
        <div className="bg-[#00382E] text-white p-4 flex items-center justify-between border-b border-[#002820] shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded bg-emerald-950 flex items-center justify-center border border-emerald-700/60 shrink-0">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-amber-400 font-bold">{complaint.trackingNumber}</span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-300">{complaint.mineName} ({complaint.subsidiary})</span>
              </div>
              <h3 id="complaint-detail-title" className="text-base font-bold text-white truncate">{complaint.title}</h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {getStatusBadge(complaint.status)}
            <button
              type="button"
              id="close-complaint-detail-btn"
              aria-label="Close dialog"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X className="w-5 h-5 pointer-events-none" />
            </button>
          </div>
        </div>

        {/* 2. Navigation Sub-tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeTab === 'details' ? 'bg-[#004D40] text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Complaint &amp; Workflow Action
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'media' ? 'bg-[#004D40] text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Evidence Media</span>
              <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded">
                {complaint.media.length + actionMedia.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'timeline' ? 'bg-[#004D40] text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Approval Timeline &amp; Hashes</span>
              <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded">
                {complaint.timeline.length}
              </span>
            </button>
          </div>

          {/* Active role indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-500">
            <span>Current Responsible Role:</span>
            <span className="font-bold text-[#004D40] uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              {complaint.currentResponsibleRole.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* 3. Modal Body (Scrollable) */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-800">
          {activeTab === 'details' && (
            <>
              {/* Context Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Colliery Location</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{complaint.mineName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{complaint.seamBlock}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Statutory Regulation</span>
                  <span className="font-bold text-[#004D40] mt-0.5 block font-mono">{complaint.regulationCode}</span>
                  <span className="text-[11px] text-slate-500">{complaint.category}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Severity Tier</span>
                  <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                    complaint.severity === 'Critical'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : complaint.severity === 'High'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {complaint.severity.toUpperCase()} VIOLATION
                  </span>
                  {complaint.equipmentId && (
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">HEMM: {complaint.equipmentId}</div>
                  )}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted By</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{complaint.submittedBy.name}</span>
                  <span className="text-[10px] text-slate-500">{complaint.submittedBy.timestamp}</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-[#004D40]" />
                  <span>Hazard Observation Description</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded border border-slate-100">
                  {complaint.description}
                </p>
              </div>

              {/* STATUTORY SEPARATION: Statutory Hazard Classification */}
              {complaint.aiInsight && (
                <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border border-teal-200/80 rounded-lg p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-teal-200/60 pb-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-teal-700" />
                      <span className="text-[11px] font-bold text-teal-950 uppercase tracking-wider">
                        DGMS Statutory Hazard Classification &amp; Directive
                      </span>
                      <span className="bg-emerald-700 text-white text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold">
                        CMR 2017 MANDATED
                      </span>
                    </div>
                    <span className="text-[10px] text-teal-800 font-mono">
                      Matrix: {complaint.aiInsight.provider}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                    <div>
                      <strong className="text-teal-900 block text-[11px]">Geotechnical Hazard Evaluation:</strong>
                      <p className="text-[11px] mt-0.5 text-slate-600">{complaint.aiInsight.hazardPrediction}</p>
                    </div>
                    <div>
                      <strong className="text-teal-900 block text-[11px]">Statutory Corrective Directive:</strong>
                      <p className="text-[11px] mt-0.5 text-slate-600">{complaint.aiInsight.suggestedMitigation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC ACTION SECTION BASED ON ACTIVE ROLE & CURRENT STAGE */}
              <div className="border-t-2 border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <span>Role-Based Workflow Action Panel</span>
                    {isMyTurn ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        Action Required from Your Role
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded">
                        Waiting for: {complaint.currentResponsibleRole.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Active User: <strong>{activeRoleProfile.name}</strong> ({activeRoleProfile.designation})
                  </span>
                </div>

                {/* Case 1: Field Inspector Turn */}
                {complaint.status === 'PENDING_INSPECTION' && currentRole === 'field_inspector' && (
                  <form onSubmit={handleFieldInspectorSubmit} className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4 text-blue-700" />
                      <span>Stage 2: Conduct On-Site Field Inspection &amp; Statutory Dispatch</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Inspection Findings &amp; Ground Audit Log
                      </label>
                      <textarea
                        value={inspectorFindings}
                        onChange={(e) => setInspectorFindings(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Physical Measurement Metric
                        </label>
                        <input
                          type="text"
                          value={measuredKey}
                          onChange={(e) => setMeasuredKey(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Measured Value vs Statutory Limit
                        </label>
                        <input
                          type="text"
                          value={measuredVal}
                          onChange={(e) => setMeasuredVal(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-1">
                      <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requiresMaintenance}
                          onChange={(e) => setRequiresMaintenance(e.target.checked)}
                          className="w-4 h-4 text-[#004D40] rounded border-slate-300"
                        />
                        <span>Requires HEMM Mechanical or Civil Maintenance Repair Work Order</span>
                      </label>
                    </div>

                    {/* Media Upload with Digital Signature */}
                    <div className="pt-2 border-t border-blue-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Attach Geotagged Field Photo / PDF Survey (Signed)</span>
                        <span className="text-[10px] text-slate-400">Cryptographically signed via PKI</span>
                      </label>
                      <input
                        type="file"
                        onChange={handleSimulatedMediaUpload}
                        className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
                      >
                        <span>{isSubmitting ? 'Signing...' : requiresMaintenance ? 'Sign & Transfer to Maintenance Officer' : 'Sign & Transfer to Audit Officer'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Case 2: Maintenance Officer Turn */}
                {complaint.status === 'ASSIGNED_MAINTENANCE' && currentRole === 'maintenance_officer' && (
                  <form onSubmit={handleMaintenanceSubmit} className="bg-amber-50/60 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center space-x-1.5">
                      <Wrench className="w-4 h-4 text-amber-700" />
                      <span>Stage 3: Execute Engineering Work Order &amp; Upload Signed Repair Proof</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Corrective Engineering Actions Executed
                      </label>
                      <textarea
                        value={maintenanceAction}
                        onChange={(e) => setMaintenanceAction(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Parts Replaced / Materials Consumed
                        </label>
                        <input
                          type="text"
                          value={partsReplaced}
                          onChange={(e) => setPartsReplaced(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Equipment / Road Downtime (Hours)
                        </label>
                        <input
                          type="number"
                          value={downtimeHours}
                          onChange={(e) => setDowntimeHours(Number(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    {/* Media Upload with Digital Signature */}
                    <div className="pt-2 border-t border-amber-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Attach Post-Repair Evidence (Inspection Certificate / After Photos)</span>
                        <span className="text-[10px] text-slate-400">Timestamped &amp; Digitally Signed</span>
                      </label>
                      <input
                        type="file"
                        onChange={handleSimulatedMediaUpload}
                        className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
                      >
                        <span>{isSubmitting ? 'Signing...' : 'Complete Repair & Request Statutory Audit Sign-off'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Case 3: Audit & Compliance Officer Turn */}
                {complaint.status === 'PENDING_AUDIT' && currentRole === 'audit_compliance_officer' && (
                  <div className="bg-purple-50/60 border border-purple-200 rounded-lg p-4 space-y-3">
                    <div className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center space-x-1.5">
                      <FileCheck className="w-4 h-4 text-purple-700" />
                      <span>Stage 4: DGMS Statutory Compliance Verification &amp; Official Seal</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Statutory Audit Remarks &amp; CMR 2017 Regulatory Findings
                      </label>
                      <textarea
                        value={auditRemarks}
                        onChange={(e) => setAuditRemarks(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          DGMS Electronic Acknowledgment Receipt Number
                        </label>
                        <input
                          type="text"
                          value={dgmsReceiptNumber}
                          onChange={(e) => setDgmsReceiptNumber(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Cryptographic PKI Signatory
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={`${activeRoleProfile.name} (${activeRoleProfile.loginId})`}
                          className="w-full text-xs p-2 border border-slate-200 rounded bg-slate-100 text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-purple-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleAuditSubmit(false)}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Deficient: Send Back to Maintenance</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAuditSubmit(true)}
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? 'Verifying...' : 'Certify Compliance & Issue DGMS Formal Closure'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Case 4: Resolved or Other Role Viewing */}
                {complaint.status === 'RESOLVED_VERIFIED' && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs uppercase mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Statutory Closure Verified &amp; Archived</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      This incident has successfully satisfied all DGMS regulations. Formal Electronic Receipt{' '}
                      <strong className="font-mono">{complaint.auditVerifiedBy?.dgmsReceiptNumber}</strong> was issued on{' '}
                      {complaint.auditVerifiedBy?.timestamp}.
                    </p>
                  </div>
                )}

                {/* Helper prompt if it's someone else's turn */}
                {!isMyTurn && complaint.status !== 'RESOLVED_VERIFIED' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center justify-between">
                    <span>
                      This complaint is currently in the queue of{' '}
                      <strong>{complaint.currentResponsibleRole.replace('_', ' ').toUpperCase()}</strong>. You are currently viewing as{' '}
                      <strong>{activeRoleProfile.designation}</strong>.
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Workflow Protected</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: EVIDENCE MEDIA GALLERY */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-[#004D40]" />
                  <span>Digital Evidence Vault ({complaint.media.length + actionMedia.length} items)</span>
                </h4>
                <label className="cursor-pointer bg-[#004D40] hover:bg-[#00382E] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Additional Media</span>
                  <input type="file" onChange={handleSimulatedMediaUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...complaint.media, ...actionMedia].map((item) => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs flex flex-col">
                    <div className="h-44 bg-slate-100 relative flex items-center justify-center overflow-hidden border-b border-slate-200">
                      {item.fileType === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.fileName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                          <FileText className="w-10 h-10 text-slate-500 mb-1" />
                          <span className="text-xs font-mono text-slate-600">{item.fileName}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{item.fileType} Document</span>
                        </div>
                      )}

                      <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                        {item.fileType.toUpperCase()}
                      </span>
                      <span className="absolute top-2 right-2 bg-emerald-700/90 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs flex items-center space-x-1">
                        <Fingerprint className="w-3 h-3" />
                        <span>PKI VERIFIED</span>
                      </span>
                    </div>

                    <div className="p-3 text-xs space-y-1.5 flex-1">
                      <div className="font-bold text-slate-900 truncate">{item.fileName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>By: {item.uploadedBy}</span>
                        <span>{(item.sizeBytes / 1000000).toFixed(2)} MB</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.timestamp}</span>
                      </div>
                      {item.gpsLocation && (
                        <div className="text-[10px] text-emerald-700 font-mono flex items-center space-x-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>GPS: {item.gpsLocation.lat.toFixed(4)}°N, {item.gpsLocation.lng.toFixed(4)}°E ({item.gpsLocation.accuracy})</span>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-slate-100">
                        <span className="text-[9px] text-slate-400 font-mono block">
                          SHA-256: {item.sha256Hash}
                        </span>
                        <span className="text-[9px] text-[#004D40] font-mono font-bold block mt-0.5">
                          Digital Signature: {item.digitalSignature}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: APPROVAL TIMELINE & AUDIT HASHES */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
                <span className="font-bold text-slate-900 block mb-0.5">Cryptographic Immutable Audit Trail</span>
                Each state transition is locked with an electronic signature and SHA-256 state digest according to DGMS Circular 04/2019 standards.
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                {complaint.timeline.map((event, idx) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#004D40] border-2 border-white text-white flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-100 pb-1.5 mb-1.5">
                        <span className="font-bold text-slate-900 text-sm">{event.action}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{event.timestamp}</span>
                      </div>
                      <div className="text-slate-600 mb-1">
                        Actor: <strong className="text-slate-800">{event.actorName}</strong> (
                        <span className="text-[#004D40] font-semibold uppercase text-[10px]">
                          {event.actorRole.replace('_', ' ')}
                        </span>
                        )
                      </div>
                      {event.comments && (
                        <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 mt-1 italic">
                          "{event.comments}"
                        </p>
                      )}
                      {event.signatureHash && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                          <span className="truncate">Hash: {event.signatureHash}</span>
                          <span className="text-emerald-700 font-bold shrink-0 ml-2">VERIFIED</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2 text-slate-500">
            <Shield className="w-4 h-4 text-[#004D40]" />
            <span>DGMS Colliery Safety Governance Platform</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
