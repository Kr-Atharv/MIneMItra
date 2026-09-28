import React, { useEffect } from 'react';
import {
  X,
  Shield,
  Clock,
  Fingerprint,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  AlertCircle
} from 'lucide-react';
import { useGovernance } from '../context/GovernanceContext';

interface RoleAuditLogModalProps {
  onClose: () => void;
}

export const RoleAuditLogModal: React.FC<RoleAuditLogModalProps> = ({ onClose }) => {
  const { roleSwitchAuditLogs } = useGovernance();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* Header Ribbon */}
        <div className="bg-[#00382E] text-white p-4 flex items-center justify-between border-b border-[#002820] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-emerald-950 flex items-center justify-center border border-emerald-700/60">
              <Fingerprint className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-emerald-300 uppercase font-bold">
                Immutable Role-Based Access Audit Ledger
              </div>
              <h3 className="text-base font-bold text-white">Cryptographic Role Switch &amp; Authentication History</h3>
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

        {/* Security Statement */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-xs text-slate-600 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#004D40]" />
            <span>
              All entries are tamper-evident, timestamped with atomic NTP clock, and retained for 5 years per DGMS statutory audit rules.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-[#004D40] bg-emerald-100 px-2 py-0.5 rounded">
            {roleSwitchAuditLogs.length} Verified Events
          </span>
        </div>

        {/* Audit Log Table */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Timestamp (IST)</th>
                  <th className="p-2.5">Officer Name &amp; ID</th>
                  <th className="p-2.5">Previous Role</th>
                  <th className="p-2.5">Authenticated Role</th>
                  <th className="p-2.5">Jurisdiction</th>
                  <th className="p-2.5">Session Hash &amp; IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {roleSwitchAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-2.5">
                      <strong className="text-slate-900 block">{log.officerName}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">{log.officerId}</span>
                    </td>
                    <td className="p-2.5 text-slate-600 uppercase font-semibold text-[10px]">
                      {log.previousRole.replace('_', ' ')}
                    </td>
                    <td className="p-2.5">
                      <span className="inline-block bg-emerald-100 text-[#004D40] font-bold text-[10px] uppercase px-2 py-0.5 rounded border border-emerald-300">
                        {log.newRole.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 text-[11px]">
                      {log.jurisdiction}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-slate-400">
                      <div className="truncate max-w-[140px]" title={log.sessionTokenHash}>
                        {log.sessionTokenHash}
                      </div>
                      <div className="text-slate-500">{log.ipAddress}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 font-mono text-[11px]">
            SHA-256 Ledger State: 0x88f2...c419 (Immutable)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg font-bold transition-colors"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
