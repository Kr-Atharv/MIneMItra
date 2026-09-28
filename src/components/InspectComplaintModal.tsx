import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Wrench, FileText, CheckCircle2, AlertTriangle, Ruler, Camera } from 'lucide-react';
import { ComplaintItem } from '../types';
import { useGovernance } from '../context/GovernanceContext';

interface InspectComplaintModalProps {
  complaint: ComplaintItem;
  isOpen: boolean;
  onClose: () => void;
}

export const InspectComplaintModal: React.FC<InspectComplaintModalProps> = ({
  complaint,
  isOpen,
  onClose
}) => {
  const { inspectComplaint, activeRoleProfile, createSignedMediaAttachment } = useGovernance();

  const [findings, setFindings] = useState('');
  const [requiresMaintenance, setRequiresMaintenance] = useState(true);
  const [bermHeight, setBermHeight] = useState('1.65m');
  const [slopeAngle, setSlopeAngle] = useState('42 degrees');
  const [gasReading, setGasReading] = useState('0.15% CH4');
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
    if (!findings.trim()) return;

    setIsSubmitting(true);
    try {
      inspectComplaint(complaint.id, {
        findings,
        measurements: {
          'Safety Berm Height': bermHeight,
          'Bench Slope Angle': slopeAngle,
          'Atmospheric Gas Telemetry': gasReading
        },
        requiresMaintenance
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
        <div className="bg-[#004D40] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-800/60 rounded-lg border border-emerald-600/50">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase bg-emerald-950/80 px-2 py-0.5 rounded text-emerald-200 border border-emerald-700/50">
                  {complaint.trackingNumber}
                </span>
                <span className="text-xs text-emerald-200">Stage 2: Field Inspection Triage</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Physical Colliery Inspection & Work Order Dispatch
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
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Hazard Brief */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Colliery Location:</span>
              <span className="font-semibold text-slate-800">{complaint.mineName}</span>
              <span className="text-slate-600 block text-[11px]">{complaint.seamBlock}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Statutory Mandate:</span>
              <span className="font-semibold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                {complaint.regulationCode}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Logged by Safety Officer:</span>
              <span className="font-semibold text-slate-800">{complaint.submittedBy.name}</span>
              <span className="text-slate-500 block text-[11px]">{complaint.submittedBy.timestamp}</span>
            </div>
          </div>

          <div className="mt-2.5 p-2.5 bg-white border border-slate-200 rounded-lg">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Reported Hazard Description
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Physical Measurements Grid */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 mb-2">
              <Ruler className="w-4 h-4 text-teal-700" />
              <span>On-Ground Physical Measurements (Statutory Verification)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Safety Berm Height</label>
                <input
                  type="text"
                  value={bermHeight}
                  onChange={(e) => setBermHeight(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-teal-600 outline-none"
                  placeholder="e.g. 1.65m"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Bench Slope Angle</label>
                <input
                  type="text"
                  value={slopeAngle}
                  onChange={(e) => setSlopeAngle(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-teal-600 outline-none"
                  placeholder="e.g. 42 degrees"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Gas / Air Telemetry</label>
                <input
                  type="text"
                  value={gasReading}
                  onChange={(e) => setGasReading(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-teal-600 outline-none"
                  placeholder="e.g. 0.15% CH4"
                  required
                />
              </div>
            </div>
          </div>

          {/* Inspector Findings */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Field Inspector Observations & Root Cause Analysis <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Record exact physical defect observed, equipment involved, and statutory corrective instructions..."
              className="w-full text-xs font-medium border border-slate-300 rounded-lg p-3 focus:border-teal-600 outline-none leading-relaxed"
              required
            />
          </div>

          {/* Routing Decision Radio */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Next Operational Workflow Stage:
            </label>
            <div className="space-y-2">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  checked={requiresMaintenance}
                  onChange={() => setRequiresMaintenance(true)}
                  className="mt-0.5 text-teal-700 focus:ring-teal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                    <Wrench className="w-3.5 h-3.5 text-amber-700" />
                    <span>Issue Mechanical / Civil Work Order to Maintenance Officer (Stage 3)</span>
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Defect requires physical plant/civil repairs (e.g. earthmoving, berm grading, brake overhaul).
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  checked={!requiresMaintenance}
                  onChange={() => setRequiresMaintenance(false)}
                  className="mt-0.5 text-teal-700 focus:ring-teal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                    <span>Bypass Maintenance &rarr; Direct Statutory Audit Certification (Stage 4)</span>
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Procedural defect or minor adjustment verified on-ground without workshop work order.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Inspector Digital Credential Footnote */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-md border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700">Digital Seal: </span>
              <span>{activeRoleProfile.name} ({activeRoleProfile.designation})</span>
            </div>
            <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
              SHA-256 PKI Signed
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
              disabled={isSubmitting || !findings.trim()}
              className="px-5 py-2 text-xs font-bold bg-[#004D40] hover:bg-[#00382e] text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
            >
              <span>Dispatch Inspection Docket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
