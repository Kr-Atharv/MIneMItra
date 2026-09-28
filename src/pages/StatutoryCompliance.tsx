import React, { useState } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  FileText,
  ShieldCheck,
  Clock,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Download,
  Lock
} from 'lucide-react';
import { STATUTORY_REGULATIONS } from '../data/mockData';
import { StatutoryRegulation } from '../types';
import { ComplianceCategorySummary } from '../components/ComplianceCategorySummary';
import { MatchedRegulationBadge } from '../components/MatchedRegulationBadge';

export const StatutoryCompliance: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Slide-over drawer for Escalation Timeline
  const [activeTimelineItem, setActiveTimelineItem] = useState<StatutoryRegulation | null>(null);

  // PDF Evidence Preview Modal
  const [pdfPreviewItem, setPdfPreviewItem] = useState<StatutoryRegulation | null>(null);

  const categories = [
    'All',
    'Mine Safety (CMR 2017)',
    'Environmental Clearances (MoEFCC)',
    'Explosives Handling',
    'HEMM & Machinery',
    'Labour Standards (Form B)'
  ];

  const filteredRegulations = STATUTORY_REGULATIONS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesSearch =
      item.regulationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.provisionDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.statutoryInCharge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.applicableSeam.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen py-4 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Statutory 4-Pillar Compliance Summary */}
        <ComplianceCategorySummary />

        {/* Header Ribbon */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-100 text-[#004D40] text-xs font-bold px-2 py-0.5 rounded uppercase">
                  DGMS Gazette Registry
                </span>
                <span className="text-xs text-slate-500 font-mono">CMR 2017 &amp; Mines Act 1952</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Statutory Compliance &amp; Regulatory Returns Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Official mandated filings, First Class Manager delegations, PKI evidence verification, and hierarchical reminder escalation
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded font-bold">
                1 Overdue Filing
              </span>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded font-bold">
                3 Due &lt;48h
              </span>
            </div>
          </div>

          {/* 1. Regulation Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pt-3 border-b border-slate-100 pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#004D40] text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 2. Advanced Search & Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3">
            <div className="sm:col-span-8 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Regulation ID (e.g. CMR-104), provision, officer name, or seam/block..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:border-[#004D40] outline-none"
              />
            </div>

            <div className="sm:col-span-4 flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium shrink-0">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Compliance Statuses</option>
                <option value="Overdue">Overdue (Immediate Action)</option>
                <option value="Due <48h">Due &lt;48h</option>
                <option value="Completed">Completed</option>
                <option value="Verified">Verified by DGMS</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. High-Density Compliance Data Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Regulation ID &amp; Provision</th>
                  <th className="py-3 px-2">Applicable Seam / Location</th>
                  <th className="py-3 px-2">Statutory In-Charge</th>
                  <th className="py-3 px-2">Due Date</th>
                  <th className="py-3 px-2 text-center">PKI Evidence</th>
                  <th className="py-3 px-2 text-center">Escalation Level</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-center">DGMS Stamp</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredRegulations.map((item) => {
                  const isOverdue = item.status === 'Overdue';
                  const isDueSoon = item.status === 'Due <48h';
                  const isVerified = item.status === 'Verified';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Regulation ID & Provision */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          <span className="font-mono font-bold text-[#004D40] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[11px]">
                            {item.regulationId}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[120px]">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-slate-800 font-normal leading-relaxed text-[11px]">
                          {item.provisionDescription}
                        </p>
                      </td>

                      {/* Applicable Seam / Location */}
                      <td className="py-3 px-2 text-[11px] text-slate-600 max-w-[140px]">
                        {item.applicableSeam}
                      </td>

                      {/* Statutory In-Charge */}
                      <td className="py-3 px-2 text-[11px] text-slate-700 font-medium">
                        {item.statutoryInCharge}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-slate-900">
                          {item.dueDate}
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            isOverdue
                              ? 'text-red-700'
                              : isDueSoon
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {isOverdue
                            ? 'Lapsed SLA'
                            : item.daysRemaining === 0
                            ? 'Due Today'
                            : `${item.daysRemaining} days left`}
                        </span>
                      </td>

                      {/* Document Evidence (Clickable PDF badge with digital PKI signature) */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {item.hasDocument ? (
                          <button
                            onClick={() => setPdfPreviewItem(item)}
                            className="inline-flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Click to view signed PKI evidence PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-red-600" />
                            <span>PDF Evidence</span>
                            <Lock className="w-2.5 h-2.5 text-emerald-600" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Not Uploaded</span>
                        )}
                      </td>

                      {/* Escalation Level */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.escalationLevel}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isOverdue
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : isDueSoon
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isVerified
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* DGMS Verification Stamp */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {item.dgmsVerified ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Pending Audit</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setActiveTimelineItem(item)}
                          className="px-2.5 py-1 bg-[#004D40] hover:bg-[#00382E] text-white rounded text-[11px] font-semibold transition-colors flex items-center space-x-1 ml-auto cursor-pointer"
                        >
                          <span>Timeline</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Mandated under Coal Mines Regulations 2017, Regulation 27 &amp; 38 (Statutory Responsibilities of Managers)
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              National DGMS Schema v2.4 (2026)
            </span>
          </div>
        </div>
      </div>

      {/* 4. Escalation Modal / Timeline Drawer (Slide-Over Panel) */}
      {activeTimelineItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-300 p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#004D40] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeTimelineItem.regulationId}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Hierarchical Escalation Ladder
                  </h3>
                  <p className="text-xs text-slate-500">
                    Statutory reminder timeline per DGMS circular SLA matrix
                  </p>
                </div>
                <button
                  onClick={() => setActiveTimelineItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Regulation Meta */}
              <div className="my-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                <div className="text-slate-600">
                  <strong className="text-slate-900">Provision:</strong> {activeTimelineItem.provisionDescription}
                </div>
                <div className="text-slate-600">
                  <strong className="text-slate-900">Seam:</strong> {activeTimelineItem.applicableSeam}
                </div>
                <div className="text-slate-600">
                  <strong className="text-slate-900">Statutory In-Charge:</strong> {activeTimelineItem.statutoryInCharge}
                </div>
              </div>

              {/* Step 7: Matched regulation, pulled from ruleBookService.js
                  as this item is worked toward closure — falls back to the
                  local statute snapshot automatically if the live source is
                  unreachable, so it never renders blank. */}
              <MatchedRegulationBadge
                query={`${activeTimelineItem.regulationId} ${activeTimelineItem.provisionDescription}`}
                className="mb-4"
              />

              {/* Timeline Tree */}
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activeTimelineItem.timeline.map((step, idx) => {
                  const isCompleted = step.status === 'completed';
                  const isCurrent = step.status === 'current';

                  return (
                    <div key={idx} className="relative flex items-start space-x-3 pl-1">
                      {/* Step marker node */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>

                      {/* Step details */}
                      <div className="bg-white border border-slate-200 rounded p-2.5 text-xs flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{step?.role || 'Officer'}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700'
                                : isCurrent
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {step?.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{step?.officer}</p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>SLA Window: {step?.slaHours} Hours</span>
                          {step?.timestamp && <span className="font-mono">{step.timestamp}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                onClick={() => {
                  alert(`Fast-track notification dispatched to ${activeTimelineItem.escalationLevel}. SHA-256 dispatch token generated.`);
                }}
                className="w-full py-2 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
              >
                Trigger Immediate Notice to {activeTimelineItem.escalationLevel}
              </button>
              <button
                onClick={() => setActiveTimelineItem(null)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Evidence Preview Modal */}
      {pdfPreviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Statutory Evidence Dossier: {pdfPreviewItem.regulationId}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Digitally Signed PDF Document (Mines Act 1952 Gazette Verification)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPdfPreviewItem(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulated Document Preview Card */}
            <div className="border border-slate-300 rounded bg-[#F8FAFC] p-4 text-xs space-y-3 font-mono">
              <div className="text-center border-b border-slate-200 pb-2">
                <p className="font-bold text-slate-900 font-sans">
                  DIRECTORATE GENERAL OF MINES SAFETY (DGMS)
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  MINISTRY OF COAL, GOVERNMENT OF INDIA • STATUTORY RETURN VAULT
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
                <div>
                  <span className="text-slate-500">Document Hash:</span>
                  <p className="font-bold text-[#004D40] truncate mt-0.5">{pdfPreviewItem.documentHash}</p>
                </div>
                <div>
                  <span className="text-slate-500">Certifying Manager:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{pdfPreviewItem.statutoryInCharge}</p>
                </div>
                <div>
                  <span className="text-slate-500">Applicable District:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{pdfPreviewItem.applicableSeam}</p>
                </div>
                <div>
                  <span className="text-slate-500">DGMS Stamp Status:</span>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {pdfPreviewItem.dgmsVerified ? 'Digitally Countersigned' : 'Awaiting Review'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 border border-slate-200 rounded text-slate-700 font-sans text-xs">
                <strong>Mandatory Provision Excerpt:</strong> {pdfPreviewItem.provisionDescription}
              </div>

              <div className="flex items-center space-x-2 text-[10px] text-slate-500 border-t border-slate-200 pt-2 font-sans">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>e-Signed with Parichay Government Token (CCA India Licensed Root Certificate).</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => {
                  alert('Generating official PDF archive with verification watermark...');
                }}
                className="px-3 py-1.5 bg-[#004D40] text-white text-xs font-bold rounded flex items-center space-x-1 hover:bg-[#00382E]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Certified PDF</span>
              </button>
              <button
                onClick={() => setPdfPreviewItem(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
