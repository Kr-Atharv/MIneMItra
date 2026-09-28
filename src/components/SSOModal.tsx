import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Lock, X, CheckCircle2, KeyRound, AlertTriangle, Building2, User, ArrowRight, Shield } from 'lucide-react';
import { IndiaEmblem } from './OfficialLogos';
import { UserProfile } from '../types';

interface SSOModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  initialRole?: string;
  isSwitchMode?: boolean;
  onLogin?: (user: UserProfile) => void;
  onSwitchUser?: (user: UserProfile) => void;
}

export const OFFICIAL_ROLES = [
  {
    role: 'MINE_MANAGER',
    roleLabel: 'Statutory Colliery Manager (CMR Reg 27)',
    defaultLoginId: 'SECL-MGR-4401',
    defaultName: 'Er. Rajeshwar Prasad, First Class Colliery Manager (FCM)',
    designation: 'Colliery Manager & Statutory Agent (Chhal Opencast Mine)',
    mineId: 'M-SECL-CHHAL',
    subsidiary: 'SECL',
    authority: 'Operational governance, pre-shift blasting approvals, CMR 2017 Reg 27 legal compliance.'
  },
  {
    role: 'DGMS_INSPECTOR',
    roleLabel: 'DGMS Statutory Inspector',
    defaultLoginId: 'DGMS-EMP-9821',
    defaultName: 'Er. Rajeshwar Rao, Dy. DGMS',
    designation: 'Deputy Director General of Mines Safety (Eastern Zone Dhanbad)',
    mineId: 'M-CCL-RAJRAPPA',
    subsidiary: 'DGMS Dhanbad',
    authority: 'Statutory regulatory authority, Section 22 stop-work orders, DGMS audit gazettes.'
  },
  {
    role: 'SAFETY_OFFICER',
    roleLabel: 'Safety Overman / Mines Surveyor (CMR Reg 34 & 35)',
    defaultLoginId: 'OVM-SURV-311',
    defaultName: 'Er. S. K. Verma, Overman',
    designation: 'Assistant Manager Safety & Field Inspection Overman',
    mineId: 'M-SECL-GEVRA',
    subsidiary: 'SECL',
    authority: 'Pit face inspections, slope stability laser readings, haul road berm checks, dust suppression.'
  },
  {
    role: 'CIL_CMD',
    roleLabel: 'Coal India CMD / Director Technical',
    defaultLoginId: 'CIL-CMD-001',
    defaultName: 'Shri P. M. Prasad',
    designation: 'Chairman & Managing Director, Coal India Limited',
    mineId: 'ALL',
    subsidiary: 'Corporate CIL',
    authority: 'National executive governance, all 377 mines across 8 subsidiaries under Ministry of Coal.'
  },
  {
    role: 'CONTRACTOR_ADMIN',
    roleLabel: 'Contractor Workforce & Vendor In-Charge',
    defaultLoginId: 'VND-CTR-8821',
    defaultName: 'Er. V. K. Aggarwal',
    designation: 'Chief Site Representative (BCCL Earthmovers Consortium)',
    mineId: 'M-BCCL-KUSMUNDA',
    subsidiary: 'BCCL',
    authority: 'Form B registers, biometric gate access, PME/IME health and VTC safety compliance.'
  },
  {
    role: 'REGULATORY_AUTHORITY',
    roleLabel: 'Regulatory Authority (Read-Only Oversight)',
    defaultLoginId: 'MOC-REG-1147',
    defaultName: 'Smt. Anjali Deshmukh, IAS',
    designation: 'Regional Controller of Mines, Ministry of Coal',
    mineId: 'ALL',
    subsidiary: 'Ministry of Coal',
    authority: 'Read-only statutory oversight — compliance status, violations, inspection history, corrective-action tracking and evidence review across mines. No edit or action permissions.'
  }
];

export const SSOModal: React.FC<SSOModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialRole,
  isSwitchMode = false,
  onLogin,
  onSwitchUser
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(
    initialRole || (currentUser ? currentUser.role : 'MINE_MANAGER')
  );
  const [loginId, setLoginId] = useState<string>('');
  const [password, setPassword] = useState<string>('CoalGuard@2026');
  const [selectedMine, setSelectedMine] = useState<string>('SECL - Chhal Opencast Colliery');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const targetRole = initialRole || (currentUser ? currentUser.role : 'MINE_MANAGER');
      setSelectedRole(targetRole);
      const roleObj = OFFICIAL_ROLES.find(r => r.role === targetRole) || OFFICIAL_ROLES[0];
      setLoginId(roleObj.defaultLoginId);
      setPassword('CoalGuard@2026');
      setErrorMessage('');
      setIsSuccess(false);
    }
  }, [isOpen, initialRole, currentUser]);

  if (!isOpen) return null;

  const handleSelectRoleTemplate = (roleKey: string) => {
    setSelectedRole(roleKey);
    const roleObj = OFFICIAL_ROLES.find(r => r.role === roleKey);
    if (roleObj) {
      setLoginId(roleObj.defaultLoginId);
      setPassword('CoalGuard@2026');
      setErrorMessage('');
    }
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Mandatory check: Login ID cannot be empty
    if (!loginId || loginId.trim() === '') {
      setErrorMessage('Statutory Mandate: Official Login ID is strictly required to proceed.');
      return;
    }

    // 2. Mandatory check: Password cannot be empty
    if (!password || password.trim() === '') {
      setErrorMessage('Security Passkey / Password is required.');
      return;
    }

    // 3. User cannot switch role without giving login id
    if (isSwitchMode) {
      const roleObj = OFFICIAL_ROLES.find(r => r.role === selectedRole);
      // Ensure Login ID is provided and formatted
      if (loginId.trim().length < 4) {
        setErrorMessage('Invalid Login ID. Please provide authorized credentials for this statutory role.');
        return;
      }
    }

    const currentRoleObj = OFFICIAL_ROLES.find(r => r.role === selectedRole) || OFFICIAL_ROLES[0];
    const userPayload: UserProfile = {
      name: currentRoleObj.defaultName,
      designation: currentRoleObj.designation,
      role: currentRoleObj.role,
      loginId: loginId.trim().toUpperCase(),
      mineId: currentRoleObj.mineId
    };

    setIsSuccess(true);
    setErrorMessage('');

    setTimeout(() => {
      if (isSwitchMode && onSwitchUser) {
        onSwitchUser(userPayload);
      } else if (onLogin) {
        onLogin(userPayload);
      }
      setIsSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#004D40] text-white px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-[#00382E] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
              <IndiaEmblem size={26} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {isSwitchMode ? 'Statutory Role Re-Authentication' : 'National Portal Sign-In & Verification'}
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded font-mono font-semibold">
                  CMR 2017
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                Ministry of Coal • Directorate General of Mines Safety (DGMS Dhanbad)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Statutory Role Notice */}
          <div className="bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-slate-900">Statutory Identity & Jurisdictional Requirement:</span>{' '}
              {isSwitchMode
                ? 'Under CMR 2017 Regulation 27 and Section 22 of Mines Act 1952, users cannot switch statutory roles without providing the authorized Login ID and passkey of the designated officer.'
                : 'Enter your designated MINEMITRA / Parichay National Officer ID, Passkey, and statutory role to initialize the portal.'}
            </div>
          </div>

          {/* Quick Demo Pre-fill Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Select Officer Role (Click to auto-populate credentials):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OFFICIAL_ROLES.map((r) => {
                const isSelected = selectedRole === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectRoleTemplate(r.role)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#004D40] bg-emerald-50/80 ring-2 ring-[#004D40]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{r.roleLabel}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#004D40]" />}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono">ID: {r.defaultLoginId}</div>
                    <div className="text-[10px] text-slate-500 truncate">{r.defaultName}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleAuthenticate} className="space-y-3.5 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Login ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Officer Login ID *</span>
                  <span className="text-[10px] text-red-600 font-normal">Mandatory</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="e.g. SECL-MGR-4401 or DGMS-EMP-9821"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg focus:border-[#004D40] focus:ring-1 focus:ring-[#004D40] outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Passkey / Password *</span>
                  <span className="text-[10px] text-red-600 font-normal">Mandatory</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter security passkey"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#004D40] focus:ring-1 focus:ring-[#004D40] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Mine Location / Jurisdiction */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mine Unit / Operational Jurisdiction
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={selectedMine}
                  onChange={(e) => setSelectedMine(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#004D40] focus:ring-1 focus:ring-[#004D40] outline-none bg-white"
                >
                  <option value="SECL - Chhal Opencast Colliery">SECL - Chhal Opencast Colliery (Raigarh Area)</option>
                  <option value="SECL - Gevra Mega Opencast Project">SECL - Gevra Mega Opencast Project (Korba)</option>
                  <option value="CCL - Rajrappa Opencast Mine">CCL - Rajrappa Opencast Mine (Ramgarh)</option>
                  <option value="BCCL - Kusmunda Open Pit Mine">BCCL - Kusmunda Open Pit Mine (Dhanbad)</option>
                  <option value="NCL - Jayant Opencast Mine">NCL - Jayant Opencast Mine (Singrauli)</option>
                  <option value="ALL - All Coal India Subsidiaries">ALL - All 377 CIL Collieries (HQ Directorate)</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-2.5 rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Identity Verified: Access Granted as {OFFICIAL_ROLES.find(r => r.role === selectedRole)?.roleLabel}. Launching system...
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>{isSwitchMode ? 'Authenticate & Switch Role' : 'Verify & Launch Website'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Security Stamp Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-2 text-[10px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-[#004D40]" />
            <span>NIC CERT-In Audited • 256-Bit Encrypted Statutory Session</span>
          </span>
          <span>Coal Mines Regulations 2017</span>
        </div>
      </div>
    </div>
  );
};
