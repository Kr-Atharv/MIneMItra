import React, { useState, useEffect } from 'react';
import { X, Wrench, ShieldCheck, CheckCircle2, Clock, Upload, FileText } from 'lucide-react';
import { ComplaintItem } from '../types';
import { useGovernance } from '../context/GovernanceContext';

interface MaintenanceRepairModalProps {
  complaint: ComplaintItem;
  isOpen: boolean;
  onClose: () => void;
}

export const MaintenanceRepairModal: React.FC<MaintenanceRepairModalProps> = ({
  complaint,
  isOpen,
  onClose
}) => {
  const { completeMaintenance, activeRoleProfile } = useGovernance();

  const [actionTaken, setActionTaken] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('140 MT Ballast Stone compacted with 20T Vibratory Roller');
  const [hoursDowntime, setHoursDowntime] = useState<number>(4);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim()) return;

    setIsSubmitting(true);
    try {
      completeMaintenance(complaint.id, {
        actionTaken,
        partsReplaced: partsReplaced.trim() || undefined,
        hoursDowntime: Number(hoursDowntime) || 0
      });
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
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header */}
        <div className="bg-amber-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-800/60 rounded-lg border border-amber-600/50">
              <Wrench className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase bg-amber-950/80 px-2 py-0.5 rounded text-amber-200 border border-amber-700/50">
                  {complaint.trackingNumber}
                </span>
                <span className="text-xs text-amber-200">Stage 3: Maintenance Execution</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Execute Workshop Repair & Submit for Statutory Audit
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
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-amber-200 hover:text-white hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Previous Stage Context (Inspector Findings) */}
        <div className="bg-amber-50/50 border-b border-amber-200 px-6 py-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Colliery: <span className="font-bold text-slate-900">{complaint.mineName}</span> ({complaint.seamBlock})
            </span>
            <span className="font-medium text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
              Mandate: {complaint.regulationCode}
            </span>
          </div>

          {complaint.inspectedBy && (
            <div className="p-2.5 bg-white border border-amber-200 rounded-lg">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-0.5">
                Field Inspector Directive ({complaint.inspectedBy.name})
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {complaint.inspectedBy.findings}
              </p>
              {complaint.inspectedBy.measurements && (
                <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                  {Object.entries(complaint.inspectedBy.measurements).map(([k, v]) => (
                    <span key={k} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      <strong>{k}:</strong> {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Repair Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Action Taken */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Detailed Mechanical / Civil Remediation Record <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Describe work performed (e.g. rebuild of haul road berm to 2.4m, replacement of hydraulic valve on Shovel-02, dust mist pipe repair)..."
              className="w-full text-xs font-medium border border-slate-300 rounded-lg p-3 focus:border-amber-700 outline-none leading-relaxed"
              required
            />
          </div>

          {/* Parts Replaced & Downtime */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Materials / Parts Replaced
              </label>
              <input
                type="text"
                value={partsReplaced}
                onChange={(e) => setPartsReplaced(e.target.value)}
                placeholder="e.g. Brake booster seal kit, 140MT rock ballast"
                className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-amber-700 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Equipment / Face Downtime (Hours)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={hoursDowntime}
                onChange={(e) => setHoursDowntime(parseFloat(e.target.value))}
                className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-amber-700 outline-none"
                required
              />
            </div>
          </div>

          {/* Workshop Sign-off Info */}
          <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700">Workshop Sign-off: </span>
              <span>{activeRoleProfile.name} ({activeRoleProfile.designation})</span>
            </div>
            <span className="font-mono text-[10px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
              Dispatches to Stage 4: DGMS Audit
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !actionTaken.trim()}
              className="px-5 py-2 text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Repair & Forward to Audit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
