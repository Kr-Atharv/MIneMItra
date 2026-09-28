import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, XCircle, FileText, Stamp, Award, AlertTriangle } from 'lucide-react';
import { ComplaintItem } from '../types';
import { useGovernance } from '../context/GovernanceContext';
import { IndiaEmblem } from './OfficialLogos';

interface AuditCertifyModalProps {
  complaint: ComplaintItem;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditCertifyModal: React.FC<AuditCertifyModalProps> = ({
  complaint,
  isOpen,
  onClose
}) => {
  const { certifyAuditCompliance, rejectMaintenance, activeRoleProfile } = useGovernance();

  const [remarks, setRemarks] = useState('Satisfactorily verified against CMR 2017 standards. All physical safety parameters restored.');
  const [dgmsReceipt, setDgmsReceipt] = useState(`DGMS-VERIF-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) return;

    setIsSubmitting(true);
    try {
      certifyAuditCompliance(complaint.id, {
        remarks,
        dgmsReceiptNumber: dgmsReceipt,
        isApproved: true
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectRemarks.trim()) return;

    setIsSubmitting(true);
    try {
      rejectMaintenance(complaint.id, rejectRemarks);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Institutional Government Header */}
        <div className="bg-[#1E1B4B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-900/80 rounded-lg border border-indigo-700">
              <IndiaEmblem size={28} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase bg-indigo-950 px-2 py-0.5 rounded text-indigo-200 border border-indigo-700/50">
                  {complaint.trackingNumber}
                </span>
                <span className="text-xs text-indigo-300">Stage 4: Statutory Compliance Certification</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                DGMS Statutory Verification &amp; Electronic Seal
              </h3>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-indigo-200 hover:text-white hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* 3-Stage Evidence Review (Side-by-side) */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chain of Custody & Evidence Verification Dossier
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Stage 1: Safety Submission */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  1. Safety Officer
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Shift {complaint.submittedBy.shift}</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 mb-1">{complaint.title}</p>
              <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                {complaint.description}
              </p>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">
                {complaint.submittedBy.name}
              </div>
            </div>

            {/* Stage 2: Inspector Findings */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  2. Field Inspector
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Verified</span>
              </div>
              {complaint.inspectedBy ? (
                <>
                  <p className="text-[11px] text-slate-700 line-clamp-3 leading-relaxed font-medium">
                    {complaint.inspectedBy.findings}
                  </p>
                  {complaint.inspectedBy.measurements && (
                    <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600">
                      {Object.entries(complaint.inspectedBy.measurements).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-500">{k}:</span>
                          <span className="font-semibold text-slate-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-[10px] text-slate-500 font-medium">
                    {complaint.inspectedBy.name}
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No inspection data recorded.</p>
              )}
            </div>

            {/* Stage 3: Maintenance Record */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  3. Maintenance Officer
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {complaint.maintenanceBy?.hoursDowntime ? `${complaint.maintenanceBy.hoursDowntime}h DT` : 'Repaired'}
                </span>
              </div>
              {complaint.maintenanceBy ? (
                <>
                  <p className="text-[11px] text-slate-700 line-clamp-3 leading-relaxed font-medium">
                    {complaint.maintenanceBy.actionTaken}
                  </p>
                  {complaint.maintenanceBy.partsReplaced && (
                    <div className="mt-1.5 text-[10px] text-slate-600 bg-slate-50 p-1 rounded border border-slate-200">
                      <span className="text-slate-500 block">Parts:</span>
                      <span className="font-semibold text-slate-800">{complaint.maintenanceBy.partsReplaced}</span>
                    </div>
                  )}
                  <div className="mt-2 text-[10px] text-slate-500 font-medium">
                    {complaint.maintenanceBy.name}
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No repair data recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Selector: Approve vs Reject */}
        <div className="p-6">
          {!isRejecting ? (
            <form onSubmit={handleApprove} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Official DGMS Verification Receipt #
                  </label>
                  <input
                    type="text"
                    value={dgmsReceipt}
                    onChange={(e) => setDgmsReceipt(e.target.value)}
                    className="w-full text-xs font-mono font-bold text-indigo-900 border border-slate-300 rounded-lg px-3 py-2 bg-indigo-50/50 focus:bg-white focus:border-indigo-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Statutory Regulation
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={complaint.regulationCode}
                    className="w-full text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-slate-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Statutory Audit Findings & Verification Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record formal statutory compliance certificate notes under CMR 2017..."
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-3 focus:border-indigo-600 outline-none leading-relaxed"
                  required
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Stamp className="w-4 h-4 text-indigo-800" />
                  <span className="font-semibold text-indigo-950">
                    Will affix immutable DGMS Gazette seal & formally close workflow (Stage 5)
                  </span>
                </div>
                <span className="font-mono text-[11px] text-indigo-900 font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">
                  {activeRoleProfile.name}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="text-xs font-bold text-red-700 hover:text-red-900 px-3 py-1.5 rounded hover:bg-red-50 transition-colors flex items-center space-x-1 border border-red-200"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject with Deficiencies</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !remarks.trim()}
                    className="px-5 py-2 text-xs font-bold bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Certify Compliance & Issue DGMS Seal</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReject} className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800 font-bold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Return Work Order to Maintenance Officer</span>
                </div>
                <p className="text-xs text-red-700">
                  The complaint will be routed back to the Maintenance Officer. Please detail the physical deficiencies that must be addressed.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Specific Deficiency Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Explain why repair is incomplete or non-compliant with CMR 2017 standards..."
                  className="w-full text-xs font-medium border border-red-300 rounded-lg p-3 focus:border-red-600 outline-none leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  ← Back to Certification Approval
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !rejectRemarks.trim()}
                  className="px-5 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirm Rejection Notice</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
