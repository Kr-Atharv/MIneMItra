import React from 'react';
import {
  FilePlus,
  UserCheck,
  Clock,
  Bell,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { EscalationItem } from '../types';

interface EscalationWorkflowStepperProps {
  currentStage?: number; // 1 to 8 (default: 6 for level 3, 7 for level 4, 8 for level 5)
  escalationItem?: EscalationItem;
}

export const EscalationWorkflowStepper: React.FC<EscalationWorkflowStepperProps> = ({
  currentStage,
  escalationItem
}) => {
  // Map level (1-5) or explicit currentStage to 1..8
  const activeStep =
    currentStage !== undefined
      ? currentStage
      : escalationItem?.level === 5
      ? 8
      : escalationItem?.level === 4
      ? 7
      : escalationItem?.level === 3
      ? 6
      : escalationItem?.level === 2
      ? 4
      : 3;

  const steps = [
    { id: 1, label: 'Created', sub: 'Logged', icon: FilePlus },
    { id: 2, label: 'Assigned', sub: 'Field crew', icon: UserCheck },
    { id: 3, label: 'Deadline', sub: 'SLA set', icon: Clock },
    { id: 4, label: 'Reminder', sub: '75% alert', icon: Bell },
    { id: 5, label: 'Overdue', sub: 'SLA breach', icon: AlertTriangle, danger: true },
    { id: 6, label: 'Escalation', sub: 'Area GM', icon: ArrowUpRight, danger: true },
    { id: 7, label: 'Senior Mgmt', sub: 'Director HQ', icon: Building2, danger: true },
    { id: 8, label: 'Regulator', sub: 'DGMS / MoC', icon: ShieldAlert, regulator: true }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-bold tracking-wider text-rose-700 uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Statutory Hierarchical Escalation Sequence</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-500">CMR 2017 REG 34 / MINES ACT SEC 22</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">
            Hazard Rectification SLA Lifecycle Stepper
          </h3>
        </div>

        {escalationItem && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-mono text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {escalationItem.id}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                activeStep >= 8
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : activeStep >= 5
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
            >
              {activeStep >= 8 ? 'Level 5 (Regulator Notified)' : `Active Tier ${activeStep}/8`}
            </span>
          </div>
        )}
      </div>

      {/* Stepper Progress Track */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px] flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
          <div
            className="absolute top-4 left-4 h-0.5 bg-rose-500 -z-0 transition-all duration-500"
            style={{
              width: `${((Math.min(activeStep, steps.length) - 1) / (steps.length - 1)) * 100}%`
            }}
          />

          {steps.map((step) => {
            const isCompleted = step.id < activeStep;
            const isCurrent = step.id === activeStep;
            const Icon = step.icon;

            const circleColor = isCurrent
              ? step.regulator
                ? 'bg-rose-700 text-white ring-4 ring-rose-200 shadow-md'
                : step.danger
                ? 'bg-amber-600 text-white ring-4 ring-amber-100 shadow-md'
                : 'bg-[#0B6B4A] text-white ring-4 ring-emerald-100 shadow-md'
              : isCompleted
              ? step.danger
                ? 'bg-amber-600 text-white'
                : 'bg-[#0B6B4A] text-white'
              : 'bg-white text-slate-400 border-2 border-slate-200';

            return (
              <div
                key={step.id}
                className="flex flex-col items-center relative z-10 text-center w-20"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${circleColor}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="mt-2 space-y-0.5">
                  <div
                    className={`text-[11px] font-bold leading-tight ${
                      isCurrent
                        ? step.regulator
                          ? 'text-rose-700'
                          : 'text-slate-900'
                        : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono leading-none">
                    {step.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Escalation Stage Detail Callout */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
        <div className="text-slate-600 flex items-center space-x-2">
          <span className="font-semibold text-slate-900">Current Trigger:</span>
          {activeStep >= 8 ? (
            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              DGMS Central Directorate &amp; MoC formally alerted under Section 22(1)
            </span>
          ) : activeStep >= 7 ? (
            <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Escalated to CIL HQ Technical Director &amp; Board Member
            </span>
          ) : (
            <span className="text-slate-700">
              Colliery-level rectification workflow in progress under First Class Manager supervision
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Protocol: DGMS Tech Circular No. 4 of 2024
        </div>
      </div>
    </div>
  );
};
