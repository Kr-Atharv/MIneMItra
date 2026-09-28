import React, { useState } from 'react';
import {
  Users,
  HardHat,
  FileSpreadsheet,
  Stethoscope,
  GraduationCap,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  CreditCard,
  Building,
  UserCheck,
  FileText
} from 'lucide-react';
import { CONTRACTOR_RECORDS } from '../data/mockData';
import { ContractorRecord } from '../types';

interface IngressLog {
  id: string;
  time: string;
  workerName: string;
  workerId: string;
  contractor: string;
  designation: string;
  status: 'GRANTED' | 'DENIED';
  reason: string;
}

export const ContractorWorkforce: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clearanceFilter, setClearanceFilter] = useState<string>('ALL');
  const [selectedContractorDossier, setSelectedContractorDossier] = useState<any | null>(null);

  // Simulated live gate ingress feed
  const [ingressLogs, setIngressLogs] = useState<IngressLog[]>([
    {
      id: 'PUNCH-8801',
      time: '14:24:12',
      workerName: 'Manoj Kumar Soren',
      workerId: 'EMP-CCL-9821',
      contractor: 'BCCL Earthmovers Ltd.',
      designation: 'Dumper Operator (240T)',
      status: 'DENIED',
      reason: 'Denied: VTC Safety Training expired 12 days ago under CMR 2017 Regulation 18'
    },
    {
      id: 'PUNCH-8802',
      time: '14:23:45',
      workerName: 'Rajeshwar Singh',
      workerId: 'EMP-SECL-4109',
      contractor: 'Eastern Mining Solutions Pvt Ltd',
      designation: 'Blasting Foreman Assistant',
      status: 'GRANTED',
      reason: 'Allowed: Biometric Form B verified. PME valid till Dec 2027'
    },
    {
      id: 'PUNCH-8803',
      time: '14:22:10',
      workerName: 'Birendra Hansda',
      workerId: 'EMP-CCL-3012',
      contractor: 'Chhal Incline Transport Co.',
      designation: 'Drill Operator',
      status: 'DENIED',
      reason: 'Denied: PME Medical Examination overdue by 45 days (Mines Rule 29B)'
    },
    {
      id: 'PUNCH-8804',
      time: '14:20:58',
      workerName: 'Sunil Toppo',
      workerId: 'EMP-BCCL-6721',
      contractor: 'Eastern Mining Solutions Pvt Ltd',
      designation: 'Haulway Maintenance Labour',
      status: 'GRANTED',
      reason: 'Allowed: VTC refresher active. Workmen compensation insurance verified'
    }
  ]);

  const addSimulatedPunch = () => {
    const isDenied = Math.random() > 0.5;
    const newLog: IngressLog = {
      id: `PUNCH-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString('en-GB'),
      workerName: isDenied ? 'Ramesh Chander Murmu' : 'Amitabh Roy',
      workerId: `EMP-CIL-${Math.floor(1000 + Math.random() * 9000)}`,
      contractor: 'BCCL Earthmovers Ltd.',
      designation: isDenied ? 'Payloader Operator' : 'Shovel Helper',
      status: isDenied ? 'DENIED' : 'GRANTED',
      reason: isDenied
        ? 'Denied: Biometric Form B punch mismatch; emergency biometric sync required'
        : 'Allowed: All statutory certifications valid (CMR 2017)'
    };
    setIngressLogs([newLog, ...ingressLogs]);
  };

  const filteredContractors = CONTRACTOR_RECORDS.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vendorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.allocatedBlock.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = clearanceFilter === 'ALL' || c.safetyClearance === clearanceFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen py-4 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Section Header */}
        <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-[#004D40] text-xs font-bold px-2 py-0.5 rounded uppercase">
                Directorate General of Mines Safety
              </span>
              <span className="text-xs text-slate-500 font-mono">Mines Act 1952 &amp; Rule 29B</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Contractor &amp; Contractual Workforce Statutory Governance
            </h2>
            <p className="text-xs text-slate-500">
              Real-time monitoring of Form B registers, Initial/Periodical Medical Exams (PME/IME), and VTC Safety Certifications
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">[CIL National Portal Gateway]</span>
        </div>

        {/* 1. Summary Metric Strip (5 Metric Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Registered Contractors */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-600 block">Registered Contractors</span>
            <span className="text-2xl font-black font-mono text-slate-900 mt-0.5 block">142</span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-1">All CIL Subsidiaries</span>
          </div>

          {/* On-Site Contractual Labour */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-600 block">On-Site Contract Labour</span>
            <span className="text-2xl font-black font-mono text-[#004D40] mt-0.5 block">12,450</span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">Today Across 3 Shifts</span>
          </div>

          {/* Form B Register Compliance */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-600 block">Form B Compliance</span>
            <span className="text-2xl font-black font-mono text-emerald-700 mt-0.5 block">99.1%</span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">Mines Act 1952 Sec 48</span>
          </div>

          {/* Overdue Medical Exams */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-600 block">Overdue PME/IME</span>
            <span className="text-2xl font-black font-mono text-[#DC2626] mt-0.5 block">28</span>
            <span className="text-[10px] text-red-700 font-bold block mt-1">Mines Rule 29B Lapsed</span>
          </div>

          {/* Expired VTC Safety Training */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-600 block">Expired VTC Training</span>
            <span className="text-2xl font-black font-mono text-[#D97706] mt-0.5 block">41</span>
            <span className="text-[10px] text-amber-800 font-bold block mt-1">Refresher Overdue</span>
          </div>
        </div>

        {/* 2. Contractor Statutory Ledger (Dense Tabular View) */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          {/* Table Controls */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Contractor Statutory Clearance Ledger</h3>
              <p className="text-[11px] text-slate-500">
                Statutory audit of outsourced mining partners, insurance validity &amp; safety training records
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search contractor, vendor code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:border-[#004D40] outline-none w-44 sm:w-56"
                />
              </div>

              <select
                value={clearanceFilter}
                onChange={(e) => setClearanceFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Clearances</option>
                <option value="Approved">Approved</option>
                <option value="Warning">Warning Notice</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Contractor Profile</th>
                  <th className="py-2.5 px-3">Assigned Mine &amp; Scope</th>
                  <th className="py-2.5 px-3 text-center">Completed Work</th>
                  <th className="py-2.5 px-3 text-center">Form B / PME</th>
                  <th className="py-2.5 px-3 text-center">Open Violations</th>
                  <th className="py-2.5 px-3 text-center">Risk Score</th>
                  <th className="py-2.5 px-3 text-center">Compliance Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredContractors.map((c) => {
                  const isApproved = c.safetyClearance === 'Approved';
                  const isWarning = c.safetyClearance === 'Warning';
                  const isSuspended = c.safetyClearance === 'Suspended';
                  const riskScore = c.riskScore ?? (isSuspended ? 82 : isWarning ? 54 : 18);
                  const openViolations = c.openViolations ?? (isSuspended ? 4 : isWarning ? 2 : 0);
                  const completedWork = c.completedWork ?? '1.20M BCM (90% target)';
                  const assignedMine = c.assignedMine ?? 'Colliery Operational Sector';
                  const assignedWork = c.assignedWork ?? c.allocatedBlock;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="font-mono text-[10px] text-slate-500">{c.vendorCode} • {c.activeManpower} Manpower</div>
                      </td>

                      <td className="py-3 px-3 text-[11px]">
                        <div className="font-semibold text-slate-800">{assignedMine}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{assignedWork}</div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-700">
                        {completedWork}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1 text-[10px]">
                          <span className={c.formBStatus === 'Uploaded & Verified' ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                            {c.formBStatus === 'Uploaded & Verified' ? '✓ Form B' : '! Form B'}
                          </span>
                          <span className="text-slate-500 font-mono">{c.pmeStatusPercent}% PME • {c.vtcCompliancePercent}% VT</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            openViolations === 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : openViolations <= 2
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {openViolations} Open
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-mono text-xs font-black ${
                              riskScore > 60 ? 'text-rose-700' : riskScore > 30 ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {riskScore}/100
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase font-bold">
                            {riskScore > 60 ? 'High' : riskScore > 30 ? 'Medium' : 'Low'} Risk
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {c.complianceStatus || c.safetyClearance}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedContractorDossier(c)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#004D40] border border-slate-300 rounded font-semibold text-[11px] shadow-2xs"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contractor Detailed Dossier Modal */}
        {selectedContractorDossier && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-[#0B6B4A] uppercase tracking-wider">
                    Statutory Contractor Profile &amp; Audit Dossier
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedContractorDossier.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Vendor Code: {selectedContractorDossier.vendorCode} • DGMS Portal Ref: {selectedContractorDossier.id}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContractorDossier(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold text-[10px] uppercase">Assigned Mine &amp; Scope</span>
                  <div className="font-bold text-slate-900">{selectedContractorDossier.assignedMine || 'Colliery Sector'}</div>
                  <div className="text-slate-600 text-[11px]">{selectedContractorDossier.assignedWork || selectedContractorDossier.allocatedBlock}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold text-[10px] uppercase">Work Execution Target</span>
                  <div className="font-bold text-slate-900">{selectedContractorDossier.completedWork || '1.20M BCM (90%)'}</div>
                  <div className="text-slate-600 text-[11px]">Active Manpower: {selectedContractorDossier.activeManpower} Personnel</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold text-[10px] uppercase">Statutory Compliance Status</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{selectedContractorDossier.complianceStatus || selectedContractorDossier.safetyClearance}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Form B: {selectedContractorDossier.formBStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    PME Fitness: {selectedContractorDossier.pmeStatusPercent}% • VTC Training: {selectedContractorDossier.vtcCompliancePercent}%
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold text-[10px] uppercase">Risk &amp; Violation Ledger</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Risk Score: {selectedContractorDossier.riskScore ?? 18}/100</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {selectedContractorDossier.openViolations ?? 0} Open Violations
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Workmen Compensation Policy valid till: {selectedContractorDossier.insuranceExpiry}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedContractorDossier(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Close Dossier
                </button>
                <button
                  onClick={() => {
                    setSelectedContractorDossier(null);
                  }}
                  className="px-3 py-1.5 bg-[#0B6B4A] hover:bg-[#095C3F] text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  Download DGMS Verification Sheet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Shift-Level Gate Ingress Biometric Punch Simulation */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                <h3 className="text-sm font-bold text-slate-900">
                  Colliery Turnstile &amp; Shift Ingress Biometric Stream
                </h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Automated gate-level verification against Form B, PME Medical &amp; VTC Training validity
              </p>
            </div>

            <button
              onClick={addSimulatedPunch}
              className="px-3 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Simulate Gate Smartcard Tap</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {ingressLogs.map((log) => {
              const isGranted = log.status === 'GRANTED';

              return (
                <div
                  key={log.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isGranted ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isGranted ? '✓' : '✕'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{log.workerName}</span>
                        <span className="text-[10px] font-mono text-slate-500">({log.workerId})</span>
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                          {log.designation}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Agency: <strong className="text-slate-800">{log.contractor}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end text-xs">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                          isGranted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">{log.time}</span>
                    </div>
                    <span
                      className={`text-[11px] mt-0.5 font-medium ${
                        isGranted ? 'text-emerald-800' : 'text-red-700'
                      }`}
                    >
                      {log.reason}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>Integration with NIC-Aadhaar Auth &amp; CIL Parichay Single Sign-On</span>
            <span>Gate Hardware ID: GT-SECL-CHHAL-01</span>
          </div>
        </div>
      </div>
    </div>
  );
};
