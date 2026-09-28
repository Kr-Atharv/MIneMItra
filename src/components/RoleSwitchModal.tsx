import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  KeyRound,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  X,
  FileText,
  Clock,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { AppRole } from '../types';
import { useGovernance, OFFICIAL_ROLE_PROFILES } from '../context/GovernanceContext';

export const RoleSwitchModal: React.FC = () => {
  const {
    currentRole,
    isRoleSwitchModalOpen,
    setIsRoleSwitchModalOpen,
    targetRoleToSwitch,
    setTargetRoleToSwitch,
    switchRoleWithAuth
  } = useGovernance();

  const [selectedRole, setSelectedRole] = useState<AppRole>(targetRoleToSwitch || currentRole);
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isRoleSwitchModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRoleSwitchModalOpen(false);
        setTargetRoleToSwitch(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRoleSwitchModalOpen, setIsRoleSwitchModalOpen, setTargetRoleToSwitch]);

  if (!isRoleSwitchModalOpen) return null;

  const roleList: {
    role: AppRole;
    title: string;
    description: string;
    color: string;
    icon: any;
    jurisdiction: string;
    sampleCred: string;
  }[] = [
    {
      role: 'safety_officer',
      title: 'Safety Officer',
      description: 'Files on-ground hazards, logs safety violations, tracks submitted complaints',
      color: 'border-emerald-600 text-emerald-800 bg-emerald-50',
      icon: Shield,
      jurisdiction: 'Chhal Opencast Mine (SECL)',
      sampleCred: 'Safety@2026'
    },
    {
      role: 'field_inspector',
      title: 'Field Inspector',
      description: 'Receives submitted hazards, conducts on-site physical audits, dispatches repairs',
      color: 'border-blue-600 text-blue-800 bg-blue-50',
      icon: UserCheck,
      jurisdiction: 'DGMS Raigarh Region',
      sampleCred: 'Inspect@2026'
    },
    {
      role: 'maintenance_officer',
      title: 'Maintenance Officer',
      description: 'Executes repair work orders, overhauls HEMM equipment, uploads signed repair proof',
      color: 'border-amber-600 text-amber-800 bg-amber-50',
      icon: KeyRound,
      jurisdiction: 'Mechanical & Excavation Dept (SECL)',
      sampleCred: 'Maintain@2026'
    },
    {
      role: 'audit_compliance_officer',
      title: 'Audit & Compliance Officer',
      description: 'Reviews resolved repairs against CMR 2017 / DGMS rules, issues official closure receipts',
      color: 'border-purple-600 text-purple-800 bg-purple-50',
      icon: FileText,
      jurisdiction: 'DGMS Statutory Audit Cell',
      sampleCred: 'Audit@2026'
    },
    {
      role: 'corporate_director',
      title: 'Corporate Director',
      description: 'Apex executive analytics, 8 subsidiary comparisons, national safety KPIs, AI policy controls',
      color: 'border-slate-800 text-slate-900 bg-slate-100',
      icon: Building2,
      jurisdiction: 'Coal India Apex Board (CIL-HQ)',
      sampleCred: 'Director@2026'
    },
    {
      role: 'regulatory_authority',
      title: 'Regulatory Authority (DGMS / MoC)',
      description: 'National read-all inspection oversight, Section 22 statutory prohibition orders, legal prosecution & audit logs',
      color: 'border-rose-700 text-rose-900 bg-rose-50',
      icon: Shield,
      jurisdiction: 'DGMS Central Directorate HQ (Pan-India)',
      sampleCred: 'Regulator@2026'
    }
  ];

  const handleSelectRole = (r: AppRole) => {
    setSelectedRole(r);
    setErrorMessage('');
    // Auto-fill test password for seamless switching
    setPassword(OFFICIAL_ROLE_PROFILES[r].password);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = switchRoleWithAuth(selectedRole, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed. Please check credentials.');
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 700);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsRoleSwitchModalOpen(false);
          setTargetRoleToSwitch(null);
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header Ribbon */}
        <div className="bg-[#00382E] text-white p-4 flex items-center justify-between border-b border-[#002820]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950 flex items-center justify-center border border-emerald-700/60">
              <Fingerprint className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono tracking-widest bg-emerald-900/90 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase">
                  Statutory RBAC Authentication
                </span>
                <span className="text-[10px] text-slate-300 font-mono">ISO 27001 • NIC Governed</span>
              </div>
              <h3 className="text-base font-bold text-white">Switch Official Role &amp; Jurisdiction</h3>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsRoleSwitchModalOpen(false);
              setTargetRoleToSwitch(null);
            }}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Audit Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-900 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mandatory Audit Policy:</strong> All role transitions are cryptographically logged with IP address, timestamp, and officer session token in the DGMS Immutable Audit Ledger.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Step 1: Select Role */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              1. Select Statutory Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roleList.map((item) => {
                const isSelected = selectedRole === item.role;
                const isCurrent = currentRole === item.role;
                const Icon = item.icon;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleSelectRole(item.role)}
                    className={`p-3 rounded-lg text-left border transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-[#004D40] ring-2 ring-[#004D40]/20 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#004D40]' : 'text-slate-500'}`} />
                          <span className="font-bold text-xs text-slate-900">{item.title}</span>
                        </div>
                        {isCurrent && (
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate">{item.jurisdiction}</span>
                      <span className="font-mono text-emerald-700 font-medium">PWD: {item.sampleCred}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Officer Information Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
            <div className="font-semibold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1.5">
              <span>Target Officer Credentials:</span>
              <span className="font-mono text-[10px] text-[#004D40] font-bold bg-emerald-100 px-2 py-0.5 rounded">
                {OFFICIAL_ROLE_PROFILES[selectedRole].loginId}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400">Officer Name:</span>{' '}
                <strong className="text-slate-800">{OFFICIAL_ROLE_PROFILES[selectedRole].name}</strong>
              </div>
              <div>
                <span className="text-slate-400">Jurisdiction:</span>{' '}
                <strong className="text-slate-800">{OFFICIAL_ROLE_PROFILES[selectedRole].mineName}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Designation:</span>{' '}
                <span className="text-slate-700">{OFFICIAL_ROLE_PROFILES[selectedRole].designation}</span>
              </div>
            </div>
          </div>

          {/* Step 3: Password Authentication */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
              <span>2. Enter Statutory Password / Token</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Pre-filled or use master <code>CoalGuard@2026</code>)
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter statutory role password"
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] outline-none font-mono"
                required
              />
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Role authenticated successfully! Initializing role workspace...</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsRoleSwitchModalOpen(false);
                setTargetRoleToSwitch(null);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-2"
            >
              <span>Authenticate &amp; Switch Role</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
