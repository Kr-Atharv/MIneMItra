import React from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  MapPin,
  ClipboardCheck,
  Users,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Shield,
  KeyRound,
  Building2,
  Radio,
  PlusCircle,
  Wrench,
  FileText,
  BookOpen,
  Stamp,
  Activity,
  Award,
  ScanText,
  BrainCircuit
} from 'lucide-react';
import { PageId, AppRole } from '../types';
import { IndiaEmblem } from './OfficialLogos';
import { useGovernance, OFFICIAL_ROLE_PROFILES } from '../context/GovernanceContext';

import {
  NAVIGATION_REGISTRY,
  NAVIGATION_GROUPS,
  resolveItemLabel,
  resolveItemBadge,
  resolveItemBadgeColor
} from '../config/navigationConfig';

interface NavigationProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  onExitToLanding?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenNewComplaint?: () => void;
  onOpenStatutoryManual?: () => void;
  onOpenAuditLog?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activePage,
  onSelectPage,
  onExitToLanding,
  isCollapsed = false,
  onToggleCollapse,
  onOpenNewComplaint,
  onOpenStatutoryManual,
  onOpenAuditLog
}) => {
  const {
    currentRole,
    activeRoleProfile,
    setIsRoleSwitchModalOpen,
    filteredComplaintsForRole,
    unreadNotificationCount
  } = useGovernance();

  // Group items for current role from declarative registry
  const groupedNavItems = React.useMemo(() => {
    const roleItems = NAVIGATION_REGISTRY.filter((item) =>
      item.roles.includes(currentRole)
    );
    return NAVIGATION_GROUPS.map((group) => ({
      groupName: group,
      items: roleItems.filter((i) => i.group === group)
    })).filter((g) => g.items.length > 0);
  }, [currentRole]);

  const getRoleHeaderColor = () => {
    switch (currentRole) {
      case 'safety_officer':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'field_inspector':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'maintenance_officer':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'audit_compliance_officer':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'corporate_director':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'regulatory_authority':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      default:
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    }
  };

  return (
    <aside
      className={`bg-[#F4F7F5] text-slate-800 flex flex-col border-r border-slate-200 transition-all duration-200 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64 sm:w-72'
      }`}
    >
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-200">
            <IndiaEmblem size={22} />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="text-xs font-bold tracking-wider uppercase text-[#0B6B4A] flex items-center space-x-1.5">
                <span>COALGUARD</span>
                <span className="text-slate-300">•</span>
                <span className="text-[#16A34A]">MINEMITRA</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                Govt. of India • DGMS Portal
              </div>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 text-slate-400 hover:text-[#0B6B4A] hover:bg-emerald-50 rounded transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="px-3.5 py-2 bg-white border-b border-slate-200 text-[11px] text-slate-600">
          <div className="flex items-center justify-between text-[10px] text-[#0B6B4A] font-semibold mb-0.5">
            <span className="flex items-center space-x-1">
              <Building2 className="w-3 h-3" />
              <span>MINE JURISDICTION</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-600">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>LIVE SENSORS</span>
            </span>
          </div>
          <div className="font-bold text-slate-900 truncate">{activeRoleProfile.mineName}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            ID: {activeRoleProfile.mineId} • {activeRoleProfile.area}
          </div>
        </div>
      )}

      {/* 3. Primary Contextual Role Action */}
      {!isCollapsed && (
        <div className="p-2.5 space-y-2 border-b border-slate-200 bg-white">
          {currentRole === 'safety_officer' && onOpenNewComplaint && (
            <button
              onClick={onOpenNewComplaint}
              className="w-full py-2 px-3 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-md text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Log Colliery Hazard</span>
            </button>
          )}

          {currentRole === 'field_inspector' && (
            <button
              onClick={() => onSelectPage('inspection')}
              className="w-full py-2 px-3 bg-[#0B6B4A] hover:bg-[#095C3F] text-white rounded-md text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Field Inspection Queue ({filteredComplaintsForRole.length})</span>
            </button>
          )}

          {currentRole === 'maintenance_officer' && (
            <button
              onClick={() => onSelectPage('inspection')}
              className="w-full py-2 px-3 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-md text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Active Work Orders ({filteredComplaintsForRole.length})</span>
            </button>
          )}

          {currentRole === 'audit_compliance_officer' && (
            <button
              onClick={() => onSelectPage('inspection')}
              className="w-full py-2 px-3 bg-[#0B6B4A] hover:bg-[#095C3F] text-white rounded-md text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>Verify Pending Seals ({filteredComplaintsForRole.length})</span>
            </button>
          )}

          {(currentRole === 'corporate_director' || currentRole === 'regulatory_authority') && (
            <button
              onClick={() => onSelectPage(currentRole === 'regulatory_authority' ? 'regulatory-oversight' : 'dashboard')}
              className="w-full py-2 px-3 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-md text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{currentRole === 'regulatory_authority' ? 'Apex Regulatory Oversight' : 'Apex Safety Overview'}</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {onOpenStatutoryManual && (
              <button
                onClick={onOpenStatutoryManual}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#0B6B4A] rounded border border-emerald-200 flex items-center justify-center space-x-1 transition-colors"
                title="Open CMR 2017 Regulatory Reference Manual"
              >
                <BookOpen className="w-3 h-3" />
                <span>CMR 2017</span>
              </button>
            )}

            {onOpenAuditLog && (
              <button
                onClick={onOpenAuditLog}
                className="py-1.5 px-2 bg-white hover:bg-emerald-50 text-slate-700 rounded border border-slate-200 flex items-center justify-center space-x-1 transition-colors"
                title="View Cryptographic Role & Session Audit Ledger"
              >
                <Shield className="w-3 h-3 text-[#0B6B4A]" />
                <span>Audit Ledger</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Role Navigation List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3 scrollbar-none">
        <div className="px-2 pb-0.5">
          {!isCollapsed && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {currentRole.replace(/_/g, ' ')} WORKSPACE
              </span>
              <span className="text-[9px] text-[#0B6B4A] font-mono">CMR RBAC</span>
            </div>
          )}
        </div>

        {groupedNavItems.map((group) => (
          <div key={group.groupName} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pt-1 pb-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-200/60 flex items-center justify-between">
                <span>{group.groupName}</span>
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id || (item.id === 'production-operations' && activePage === 'production');
              const label = resolveItemLabel(item, currentRole);
              const badge = resolveItemBadge(item, currentRole, { complaintCount: filteredComplaintsForRole.length });
              const badgeColor = resolveItemBadgeColor(item, currentRole);

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0B6B4A] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white hover:text-[#0B6B4A]'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#0B6B4A]'}`} />

                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{label}</span>
                      {badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            isActive ? 'bg-white/20 text-white' : badgeColor
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 5. Active Officer Persona Card & Role Switcher */}
      <div className="p-2 border-t border-slate-200 bg-white">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className={`p-2 rounded-lg border text-xs ${getRoleHeaderColor()}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                  ACTIVE OFFICER
                </span>
                <span className="font-mono text-[9px] text-slate-400">{activeRoleProfile.loginId}</span>
              </div>
              <div className="font-bold text-slate-900 truncate">{activeRoleProfile.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{activeRoleProfile.designation}</div>
            </div>

            <button
              onClick={() => setIsRoleSwitchModalOpen(true)}
              className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#0B6B4A] rounded border border-emerald-200 text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Switch Statutory Role</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => setIsRoleSwitchModalOpen(true)}
              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-[#0B6B4A] rounded-lg border border-emerald-200"
              title="Switch Statutory Role"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
