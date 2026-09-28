import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Globe,
  UserCheck,
  Shield,
  Layers,
  KeyRound,
  Building2,
  Bell,
  Check,
  ExternalLink,
  BookOpen,
  FileText,
  Fingerprint,
  X
} from 'lucide-react';
import { CoalguardLogo, IndiaEmblem } from './OfficialLogos';
import { ShiftType, Language, AccessibilitySize, PageId } from '../types';
import { useGovernance } from '../context/GovernanceContext';
import { PortalNav, PortalNavId } from './PortalNav';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  shift: ShiftType;
  onShiftChange: (shift: ShiftType) => void;
  accessibility: AccessibilitySize;
  onAccessibilityChange: (size: AccessibilitySize) => void;
  onNavigateHome: () => void;
  onOpenStatutoryManual?: () => void;
  onOpenAuditLog?: () => void;
  activePage?: PageId;
  onSelectPage?: (page: PageId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  shift,
  onShiftChange,
  accessibility,
  onAccessibilityChange,
  onNavigateHome,
  onOpenStatutoryManual,
  onOpenAuditLog,
  activePage,
  onSelectPage
}) => {
  const {
    currentRole,
    activeRoleProfile,
    setIsRoleSwitchModalOpen,
    notifications,
    unreadNotificationCount,
    markNotificationRead
  } = useGovernance();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timeStr =
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) + ' IST';
      setCurrentDate(dateStr);
      setCurrentTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const shiftInfo = {
    A: { label: 'Shift A (Morning)', time: '06:00 – 14:00', color: 'bg-emerald-500' },
    B: { label: 'Shift B (Afternoon)', time: '14:00 – 22:00', color: 'bg-amber-500' },
    C: { label: 'Shift C (Night)', time: '22:00 – 06:00', color: 'bg-blue-500' }
  };

  const getRoleColorBadge = () => {
    switch (currentRole) {
      case 'safety_officer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'field_inspector':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'maintenance_officer':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'audit_compliance_officer':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'corporate_director':
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 select-none shrink-0 z-20">
      {/* 1. Official Government Top Ribbon (Dark Forest Green #004D40) */}
      <div className="bg-[#004D40] text-white px-3 sm:px-6 py-1 text-[11px] sm:text-xs font-medium border-b border-[#00382E]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1">
          {/* Left: Ministry Masthead Line */}
          <div className="flex items-center space-x-2 tracking-wide text-slate-100">
            <span className="font-semibold text-white">GOVERNMENT OF INDIA</span>
            <span className="text-emerald-300/60">•</span>
            <span>MINISTRY OF COAL</span>
            <span className="text-emerald-300/60 hidden md:inline">•</span>
            <span className="hidden md:inline">COAL INDIA LIMITED</span>
            <span className="text-emerald-300/60 hidden lg:inline">•</span>
            <span className="hidden lg:inline text-amber-300 font-semibold">DGMS STATUTORY OVERSIGHT</span>
          </div>

          {/* Right: Live Telemetry, Shift, Language & Accessibility */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Live Date & Time */}
            <div className="flex items-center space-x-1.5 text-slate-200">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>{currentDate}</span>
              <span className="text-emerald-300 font-mono text-[11px] font-semibold">{currentTime}</span>
            </div>

            {/* Live Shift Indicator Dropdown */}
            <div className="flex items-center space-x-1 bg-black/20 px-2 py-0.5 rounded border border-white/10">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider">Shift:</span>
              <select
                value={shift}
                onChange={(e) => onShiftChange(e.target.value as ShiftType)}
                className="bg-transparent text-white font-bold cursor-pointer outline-none text-[11px] pr-1"
                aria-label="Active Shift Selector"
              >
                <option value="A" className="bg-slate-900 text-white">Shift A (Morning)</option>
                <option value="B" className="bg-slate-900 text-white">Shift B (Afternoon)</option>
                <option value="C" className="bg-slate-900 text-white">Shift C (Night)</option>
              </select>
              <span className={`w-2 h-2 rounded-full ${shiftInfo[shift].color} animate-pulse`} />
            </div>

            {/* Language Toggle (English / हिन्दी) */}
            <div className="flex items-center space-x-1 border-l border-white/20 pl-2">
              <Globe className="w-3 h-3 text-slate-300" />
              <button
                onClick={() => onLanguageChange(language === 'en' ? 'hi' : 'en')}
                className="hover:text-amber-300 font-medium transition-colors cursor-pointer"
                title="Toggle Language"
              >
                {language === 'en' ? 'हिन्दी' : 'English'}
              </button>
            </div>

            {/* Accessibility Controls (A- | A | A+) */}
            <div className="hidden sm:flex items-center space-x-1 border-l border-white/20 pl-2 text-[10px]">
              <span className="text-slate-300 mr-0.5">Font:</span>
              <button
                onClick={() => onAccessibilityChange('normal')}
                className={`px-1 py-0.5 rounded ${accessibility === 'normal' ? 'bg-white/20 font-bold text-white' : 'text-slate-300 hover:text-white'}`}
                title="Default Font Size"
              >
                A-
              </button>
              <button
                onClick={() => onAccessibilityChange('large')}
                className={`px-1 py-0.5 rounded ${accessibility === 'large' ? 'bg-white/20 font-bold text-white' : 'text-slate-300 hover:text-white'}`}
                title="Medium Font Size"
              >
                A
              </button>
              <button
                onClick={() => onAccessibilityChange('xlarge')}
                className={`px-1 py-0.5 rounded ${accessibility === 'xlarge' ? 'bg-white/20 font-bold text-white' : 'text-slate-300 hover:text-white'}`}
                title="Larger Font Size"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Institutional Masthead */}
      <div className="px-4 sm:px-6 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Logo & Government Emblem Block */}
          <div
            onClick={onNavigateHome}
            className="flex items-center space-x-3 sm:space-x-4 cursor-pointer group"
          >
            {/* Ashoka Emblem */}
            <div className="shrink-0">
              <IndiaEmblem size={40} />
            </div>

            <div className="h-9 w-[1px] bg-slate-300 hidden sm:block" />

            {/* Minemitra Coalguard Logo */}
            <div className="shrink-0 p-1 bg-slate-50 border border-slate-200 rounded-md group-hover:border-[#004D40] transition-colors shadow-2xs">
              <CoalguardLogo size={38} color="#004D40" />
            </div>

            {/* Title & Hierarchy Labels */}
            <div>
              <div className="flex items-baseline space-x-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#0B6B4A]">
                  COALGUARD <span className="text-slate-400 font-light">•</span> MINEMITRA
                </h1>
                <span className="hidden sm:inline text-[10px] font-semibold bg-emerald-50 text-[#004D40] border border-emerald-300 px-1.5 py-0.2 rounded">
                  DGMS CMR 2017
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-700">
                {language === 'en'
                  ? 'National Coal Mine Safety, Statutory Compliance & Operational Governance Platform'
                  : 'राष्ट्रीय कोयला खान सुरक्षा, सांविधिक अनुपालन एवं प्रचालन अभिशासन मंच'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Directorate General of Mines Safety (DGMS) • Ministry of Coal, Government of India
              </p>
            </div>
          </div>

          {/* Right: Quick Tools & Verified Officer Credential Widget */}
          <div className="flex items-center space-x-2 sm:space-x-3 self-end md:self-auto">
            {/* Statutory Reference Manual Button */}
            {onOpenStatutoryManual && (
              <button
                onClick={onOpenStatutoryManual}
                className="hidden lg:flex items-center space-x-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-[#004D40] border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                title="DGMS CMR 2017 & Mines Act 1952 Statutory Reference Manual"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                <span className="font-semibold text-[11px]">CMR 2017 Rules</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">DGMS</span>
              </button>
            )}

            {/* Notifications Bell Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                title="Real-time Operational & Workflow Notifications"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-[#00382E] text-white flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <Bell className="w-4 h-4 text-emerald-300" />
                      <span className="font-bold text-xs">Real-Time Notifications</span>
                    </div>
                    <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded font-mono">
                      {unreadNotificationCount} Unread
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 transition-colors cursor-pointer ${
                            n.read ? 'bg-white opacity-70' : 'bg-emerald-50/40 hover:bg-emerald-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="font-bold text-slate-900 text-[11px] leading-tight">
                              {n.title}
                            </span>
                            <span className="text-[9px] text-slate-400 whitespace-nowrap font-mono">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-[#004D40]">{n.trackingNumber}</span>
                            {!n.read && (
                              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Mark read</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400">No new notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Statutory Role & Password-Protected Switch Button */}
            <button
              onClick={() => setIsRoleSwitchModalOpen(true)}
              className="flex items-center space-x-2.5 bg-[#F8FAFC] hover:bg-emerald-50 text-slate-800 border border-slate-300 hover:border-[#004D40] px-3 py-1.5 rounded-lg transition-all shadow-2xs group cursor-pointer"
              title="Click to switch role (Requires password authentication and full audit logging)"
            >
              <div className="w-7 h-7 rounded-full bg-[#004D40] text-white flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-left text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-900 group-hover:text-[#004D40] leading-none truncate max-w-[130px] sm:max-w-[180px]">
                    {activeRoleProfile.name}
                  </span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded border uppercase font-bold ${getRoleColorBadge()}`}>
                    {currentRole.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-0.5">
                  <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                  <span className="text-emerald-700 font-semibold">Switch Role (Password Auth)</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {onSelectPage && (
        <PortalNav
          activePage={activePage}
          onSelect={(id: PortalNavId) => {
            if (id === 'contact') {
              onOpenStatutoryManual?.();
              return;
            }
            if (id === 'landing') {
              onNavigateHome();
              return;
            }
            onSelectPage(id);
          }}
        />
      )}
    </header>
  );
};
