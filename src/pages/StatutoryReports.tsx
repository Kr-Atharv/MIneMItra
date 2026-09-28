import React, { useState } from 'react';
import {
  FileText,
  Download,
  AlertOctagon,
  BellRing,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ShieldAlert,
  Smartphone,
  Mail,
  MessageSquare,
  Building2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { PageId } from '../types';

interface StatutoryReportsProps {
  onNavigate?: (page: PageId) => void;
}

export const StatutoryReports: React.FC<StatutoryReportsProps> = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [alertDispatched, setAlertDispatched] = useState<boolean>(false);

  // Dispatcher states
  const [recipientGroup, setRecipientGroup] = useState<string>('all');
  const [alertTemplate, setAlertTemplate] = useState<string>('section22');
  const [customMessage, setCustomMessage] = useState<string>(
    'URGENT DGMS DIRECTIVE: Section 22 notice issued for Rajrappa OC Sector IV Bench 4. All heavy machinery movement on crest suspended immediately. First Class Manager to confirm compliance.'
  );

  const exportCards = [
    {
      id: 'form-1',
      title: 'Form I: Annual Returns on Safety & Employment',
      gazetteRef: 'Mines Act 1952, Section 48 & CMR 2017 Schedule I',
      format: 'PDF / Excel',
      lastGenerated: '01 Jan 2026',
      status: 'Statutorily Due',
      description: 'Comprehensive annual statistical compilation of workforce employment, man-hours, and safety performance.'
    },
    {
      id: 'form-4a',
      title: 'Form IV-A: Dangerous Occurrence & Incident Intimation',
      gazetteRef: 'Coal Mines Regulations 2017, Regulation 8(1)',
      format: 'PDF (Certified)',
      lastGenerated: '03 Sept 2026',
      status: 'Active Dossier',
      description: 'Mandatory 24-hour statutory intimation of any slope failure, gas outbreak, fire or machinery overturn.'
    },
    {
      id: 'dgms-quarterly',
      title: 'DGMS Quarterly Statistical Safety Returns',
      gazetteRef: 'DGMS (Tech) Circular No. 04 of 2019',
      format: 'Excel / CSV',
      lastGenerated: '30 June 2026',
      status: 'Filed & Countersigned',
      description: 'Quarterly breakdown of injuries, frequency rate, severity rate, and machinery operating hours.'
    },
    {
      id: 'moefcc-dossier',
      title: 'MoEFCC Half-Yearly Environmental Compliance Dossier',
      gazetteRef: 'Environmental Clearance (EC) General Condition No. 12',
      format: 'PDF (Watermarked)',
      lastGenerated: '15 July 2026',
      status: 'Submitted to Regional Office',
      description: 'Ambient air quality (CAAQMS), effluent water discharge tests, and topsoil preservation progress.'
    }
  ];

  const section22Notices = [
    {
      id: 'SEC22-SECL-2026-08',
      mineName: 'Rajrappa Opencast Mine (CCL)',
      sectionClause: 'Section 22(1A) - Imminent Danger',
      violation: 'Bench slope instability and crack elongation on Eastern Overburden Bench 4 without statutory terracing.',
      rectificationWindow: '48 Hours (Expires 07-Sep-2026)',
      issuingOfficer: 'Shri A. K. Mandal, Dy. Director of Mines Safety (Ranchi Region)',
      status: 'ACTIVE'
    },
    {
      id: 'SEC22-BCCL-2026-04',
      mineName: 'Moonidih Deep Shaft (BCCL)',
      sectionClause: 'Section 22(3) - Improvement Notice',
      violation: 'Auxiliary ventilation air quantity below prescribed 30 m³/min in Seam XVI return airway.',
      rectificationWindow: '7 Days (Rectification Verified)',
      issuingOfficer: 'Er. R. N. Mukherjee, Director of Mines Safety (Dhanbad)',
      status: 'LIFTED'
    },
    {
      id: 'SEC22-SECL-2026-01',
      mineName: 'Chhal Opencast Mine (SECL)',
      sectionClause: 'Section 22(1) - Road Haulway Incline',
      violation: 'Ramp A gradient exceeded 1 in 14 without intermediate level rest bays for dumpers.',
      rectificationWindow: '14 Days (Compliance Pending Verification)',
      issuingOfficer: 'Shri S. P. Choudhary, Dy. Director of Mines Safety (Bilaspur)',
      status: 'UNDER RECTIFICATION'
    }
  ];

  const handleDownload = (id: string, title: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      alert(`Certified DGMS copy of ${title} generated with SHA-256 digital signature stamp.`);
    }, 1200);
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertDispatched(true);
    setTimeout(() => {
      setAlertDispatched(false);
      alert('Statutory broadcast dispatched to 142 Colliery Managers & DGMS Zonal Officers via SMS Gateway & WhatsApp.');
    }, 1500);
  };

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen py-4 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-[#004D40] text-xs font-bold px-2 py-0.5 rounded uppercase">
                Regulatory Export Gateway
              </span>
              <span className="text-xs text-slate-500 font-mono">National e-Governance Standard (NIC)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Statutory Reports, Section 22 Notices &amp; Alert Dispatcher
            </h2>
            <p className="text-xs text-slate-500">
              One-click certified government schedule generation, stop-work notice tracking, and SMS/WhatsApp emergency alerts
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">[DGMS Circular 2026 Archive]</span>
        </div>

        {/* 1. Export Hub (NIC e-Gov Standard Cards) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Official Regulatory Return Filings &amp; Schedules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {exportCards.map((card) => (
              <div
                key={card.id}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between hover:border-[#004D40] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#004D40] uppercase block">
                        {card.gazetteRef}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{card.title}</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {card.format}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-slate-500">
                    Last Generated: <strong className="text-slate-800 font-mono">{card.lastGenerated}</strong>
                  </div>

                  <button
                    onClick={() => handleDownload(card.id, card.title)}
                    disabled={downloadingId === card.id}
                    className="px-3 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingId === card.id ? 'Generating PKI...' : 'Export Certified Copy'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Section 22 Emergency Notice Ledger */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-red-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-bold text-red-950">
                  DGMS Section 22 Statutory Notice &amp; Stop-Work Ledger
                </h3>
                <p className="text-[11px] text-red-800">
                  Enforcement of Mines Act 1952 Section 22 / 22A orders regarding imminent safety hazards
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2.5 py-1 rounded">
              1 Active Stop-Work Order
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-slate-700 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Notice Reference &amp; Mine</th>
                  <th className="py-2.5 px-2">Statutory Clause</th>
                  <th className="py-2.5 px-2">Violation Description</th>
                  <th className="py-2.5 px-2">Rectification SLA</th>
                  <th className="py-2.5 px-2">Issuing DGMS Authority</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {section22Notices.map((notice) => {
                  const isActive = notice.status === 'ACTIVE';
                  const isUnder = notice.status === 'UNDER RECTIFICATION';

                  return (
                    <tr key={notice.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#004D40] block">{notice.id}</span>
                        <span className="font-bold text-slate-900">{notice.mineName}</span>
                      </td>

                      <td className="py-3 px-2 font-mono text-[11px] text-slate-700">
                        {notice.sectionClause}
                      </td>

                      <td className="py-3 px-2 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                        {notice.violation}
                      </td>

                      <td className="py-3 px-2 font-mono text-[11px] font-bold text-slate-900">
                        {notice.rectificationWindow}
                      </td>

                      <td className="py-3 px-2 text-[11px] text-slate-600">
                        {notice.issuingOfficer}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : isUnder
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {notice.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Alert Notification Dispatcher */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellRing className="w-4 h-4 text-[#004D40]" />
              <h3 className="text-sm font-bold text-slate-900">
                Statutory Emergency Alert Dispatcher (NIC SMS / WhatsApp Gateway)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              NIC SMS GATEWAY ID: COALGUARD-GOV
            </span>
          </div>

          <form onSubmit={handleDispatch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recipient Group Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Recipient Group:
                </label>
                <select
                  value={recipientGroup}
                  onChange={(e) => setRecipientGroup(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded p-2 bg-white focus:border-[#004D40] outline-none cursor-pointer"
                >
                  <option value="all">All Colliery Managers &amp; Area Safety Officers (377 Mines)</option>
                  <option value="section22">Active Section 22 Mines Only (Rajrappa &amp; Chhal)</option>
                  <option value="dgms">DGMS Zonal &amp; Regional Safety Directors</option>
                  <option value="cmd">Subsidiary Technical Directors &amp; Corporate CMDs</option>
                </select>
              </div>

              {/* Pre-approved Template Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pre-Approved Gazette Template:
                </label>
                <select
                  value={alertTemplate}
                  onChange={(e) => {
                    setAlertTemplate(e.target.value);
                    if (e.target.value === 'section22') {
                      setCustomMessage(
                        'URGENT DGMS DIRECTIVE: Section 22 notice issued for Rajrappa OC Sector IV Bench 4. All heavy machinery movement on crest suspended immediately. First Class Manager to confirm compliance.'
                      );
                    } else if (e.target.value === 'rainfall') {
                      setCustomMessage(
                        'WEATHER ADVISORY: Continuous monsoon rainfall >45mm detected in Korba/Raigarh basin. Compulsory hourly inspection of sump dewatering pumps and bench tension cracks mandated.'
                      );
                    } else if (e.target.value === 'blasting') {
                      setCustomMessage(
                        'BLASTING SAFETY NOTICE: Standard 500m danger cordon clearance required for Pattern #44 at 15:30. Evacuation confirmation by Shift Overman is statutory.'
                      );
                    }
                  }}
                  className="w-full text-xs font-medium border border-slate-300 rounded p-2 bg-white focus:border-[#004D40] outline-none cursor-pointer"
                >
                  <option value="section22">DGMS Section 22 Immediate Stop-Work Directive</option>
                  <option value="rainfall">Monsoon Heavy Rainfall &amp; Sump Flood Alert</option>
                  <option value="blasting">500m Blasting Danger Zone Clearance Warning</option>
                </select>
              </div>
            </div>

            {/* Custom Message Body */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Broadcast Message Body (Unicode SMS / WhatsApp Text):
              </label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded bg-white focus:border-[#004D40] outline-none font-sans"
              />
            </div>

            {/* Channels & Submit */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-4 text-xs text-slate-600">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#004D40]" />
                  <span>NIC SMS Gateway</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#004D40]" />
                  <span>Govt WhatsApp Enterprise</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#004D40]" />
                  <span>Colliery Siren Radio Link</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={alertDispatched}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-bold rounded uppercase tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{alertDispatched ? 'Broadcasting...' : 'Broadcast Emergency Alert Blast'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
