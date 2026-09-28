import React from 'react';
import {
  ShieldCheck,
  Leaf,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useGovernance } from '../context/GovernanceContext';

export const ComplianceCategorySummary: React.FC = () => {
  const { complaints } = useGovernance();

  // Aggregate counts
  const safetyCount = complaints.filter(
    (c) =>
      c.category === 'Bench Stability & Slope' ||
      c.category === 'Ventilation & Gas' ||
      c.category === 'Haul Road & Transport' ||
      c.category === 'HEMM Mechanical/Electrical' ||
      c.category === 'Explosives & Blasting'
  ).length;

  const envCount = complaints.filter((c) => c.category === 'Environmental Compliance').length;
  const labourCount = complaints.filter((c) => c.category === 'Form B / Labour Welfare').length;

  const categories = [
    {
      id: 'safety',
      title: 'Safety Compliance',
      statute: 'CMR 2017 / Mines Act 1952',
      complianceRate: 93.4,
      openItems: safetyCount,
      resolvedRate: '94.2%',
      status: 'Statutory Active',
      statusColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: ShieldCheck,
      iconColor: 'text-[#0B6B4A]',
      accentBg: 'bg-emerald-50/60',
      indicators: [
        { label: 'Slope & Bench Stability', val: 'CMR 106: Stable' },
        { label: 'Airway / Ventilation', val: 'CMR 104: 0.12% CH4' }
      ]
    },
    {
      id: 'environment',
      title: 'Environmental Compliance',
      statute: 'MoEFCC EC / CPCB Standards',
      complianceRate: 96.1,
      openItems: envCount > 0 ? envCount : 1,
      resolvedRate: '98.0%',
      status: 'CTO Valid',
      statusColor: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: Leaf,
      iconColor: 'text-teal-600',
      accentBg: 'bg-teal-50/60',
      indicators: [
        { label: 'Ambient PM10 / PM2.5', val: 'Within CPCB NAAQS' },
        { label: 'ETP Zero-Discharge', val: 'Water Harvested' }
      ]
    },
    {
      id: 'production',
      title: 'Production Governance',
      statute: 'Approved Mining Plan (MoC)',
      complianceRate: 94.8,
      openItems: 2,
      resolvedRate: '92.5%',
      status: 'Plan Adherent',
      statusColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: Activity,
      iconColor: 'text-indigo-600',
      accentBg: 'bg-indigo-50/60',
      indicators: [
        { label: 'Stripping Ratio (OB:Coal)', val: '2.70 m³/T (Safe)' },
        { label: 'Stockpile Height Limit', val: 'Compliant' }
      ]
    },
    {
      id: 'labour',
      title: 'Labour & Workforce Welfare',
      statute: 'Mines Rules 1955 (Form B)',
      complianceRate: 97.8,
      openItems: labourCount,
      resolvedRate: '96.4%',
      status: 'Form B Verified',
      statusColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Users,
      iconColor: 'text-amber-600',
      accentBg: 'bg-amber-50/60',
      indicators: [
        { label: 'Biometric Muster Rate', val: '98.2% Active' },
        { label: 'PME & VT Certifications', val: '99.1% Current' }
      ]
    }
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
          <FileText className="w-3.5 h-3.5 text-[#0B6B4A]" />
          <span>Statutory Compliance Matrix • 4 Pillars</span>
        </h2>
        <span className="text-[11px] font-mono text-slate-500">
          Cross-referenced to DGMS &amp; MoEFCC statutes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${cat.accentBg}`}>
                    <Icon className={`w-4 h-4 ${cat.iconColor}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cat.statusColor}`}>
                    {cat.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{cat.title}</h3>
                <div className="text-[10px] text-slate-500 font-medium mb-3">{cat.statute}</div>

                <div className="flex items-baseline space-x-1.5 mb-2">
                  <span className="text-2xl font-black text-slate-900">{cat.complianceRate}%</span>
                  <span className="text-[11px] text-slate-500 font-semibold">compliance</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-[#0B6B4A]"
                    style={{ width: `${cat.complianceRate}%` }}
                  />
                </div>

                <div className="space-y-1.5 text-[11px] pt-2.5 border-t border-slate-100 text-slate-600">
                  {cat.indicators.map((ind, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">{ind.label}:</span>
                      <span className="font-semibold text-slate-800 text-right">{ind.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{cat.openItems} Open Items</span>
                <span className="text-emerald-700 font-bold">{cat.resolvedRate} Resolved</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
