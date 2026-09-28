/**
 * COALGUARD • MINEMITRA
 * National Coal Mine Safety & Statutory Compliance Operational Platform
 * Under DGMS & Ministry of Coal, Government of India
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { SSOModal } from './components/SSOModal';
import { RoleSwitchModal } from './components/RoleSwitchModal';
import { RoleAuditLogModal } from './components/RoleAuditLogModal';
import { CMRReferenceModal } from './components/CMRReferenceModal';
import { NewComplaintModal } from './components/NewComplaintModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { GovernanceDashboard } from './pages/GovernanceDashboard';
import { StatutoryCompliance } from './pages/StatutoryCompliance';
import { GISMonitoring } from './pages/GISMonitoring';
import { FieldInspection } from './pages/FieldInspection';
import { ContractorWorkforce } from './pages/ContractorWorkforce';
import { StatutoryReports } from './pages/StatutoryReports';
import { GovernanceOverview } from './pages/GovernanceOverview';
import { DocumentIntelligence } from './pages/DocumentIntelligence';
import { ProductionOperations } from './pages/ProductionOperations';
import { RegulatoryOversight } from './pages/RegulatoryOversight';
import { DutyVoiceAssistant } from './components/DutyVoiceAssistant';

import { PageId, ShiftType, Language, AccessibilitySize, UserProfile, AppRole } from './types';
import { FileText, Download, X, ShieldCheck } from 'lucide-react';
import { GovernanceProvider, useGovernance, OFFICIAL_ROLE_PROFILES } from './context/GovernanceContext';

function AppContent() {
  const {
    currentRole,
    activeRoleProfile,
    isRoleSwitchModalOpen,
    setIsRoleSwitchModalOpen,
    filteredComplaintsForRole,
    setActiveWorkflowRole
  } = useGovernance();

  // The SSO login screen (SSOModal) has its own decorative set of role
  // labels (OFFICIAL_ROLES in that file) used only for display/greeting —
  // they are NOT the same as GovernanceContext's AppRole, which is what
  // actually drives the 5-stage complaint workflow (who sees what, who
  // can inspect/repair/certify). Without this map, no matter which role
  // you picked at login, the workflow silently stayed on its 'safety_officer'
  // default — so a complaint you submitted would never appear to "reach"
  // a Field Inspector, Maintenance Officer, etc. because you were never
  // actually switched into that workflow role in the first place.
  const SSO_ROLE_TO_WORKFLOW_ROLE: Record<string, AppRole> = {
    SAFETY_OFFICER: 'safety_officer',
    DGMS_INSPECTOR: 'field_inspector',
    MINE_MANAGER: 'maintenance_officer',
    CIL_CMD: 'corporate_director',
    CONTRACTOR_ADMIN: 'maintenance_officer',
    REGULATORY_AUTHORITY: 'regulatory_authority'
  };

  // Authentication & Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<PageId>('landing');
  const [language, setLanguage] = useState<Language>('en');
  const [shift, setShift] = useState<ShiftType>('A');
  const [accessibility, setAccessibility] = useState<AccessibilitySize>('normal');
  const [isSSOOpen, setIsSSOOpen] = useState<boolean>(false);
  const [ssoInitialRole, setSsoInitialRole] = useState<string>('MINE_MANAGER');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isCircularModalOpen, setIsCircularModalOpen] = useState<boolean>(false);

  // Secondary interactive modals
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState<boolean>(false);
  const [isStatutoryManualOpen, setIsStatutoryManualOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);

  // Called when user completes login from landing page ("Get started")
  const handleLoginSuccess = (user: UserProfile) => {
    const workflowRole = SSO_ROLE_TO_WORKFLOW_ROLE[user.role];
    if (workflowRole) setActiveWorkflowRole(workflowRole);
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  const handleOpenAuthFromLanding = (role?: string) => {
    setSsoInitialRole(role || 'MINE_MANAGER');
    setIsSSOOpen(true);
  };

  const getFontSizeClass = () => {
    switch (accessibility) {
      case 'large':
        return 'text-[16px]';
      case 'xlarge':
        return 'text-[17px]';
      default:
        return 'text-[14px]';
    }
  };

  // 1. Landing Page View (when unauthenticated or explicitly on landing)
  if (!isAuthenticated || activePage === 'landing') {
    return (
      <div className={`min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 ${getFontSizeClass()}`}>
        <LandingPage
          onNavigate={(page) => {
            if (page === 'landing') {
              setActivePage('landing');
            } else {
              handleOpenAuthFromLanding('MINE_MANAGER');
            }
          }}
          onOpenAuth={handleOpenAuthFromLanding}
          onOpenCircularModal={() => setIsCircularModalOpen(true)}
          currentLanguage={language}
          onSelectLanguage={setLanguage}
        />

        {/* Official NIC / Ministry of Coal Footer */}
        <Footer onNavigate={(page) => {
          if (page === 'landing') {
            setActivePage('landing');
          } else {
            handleOpenAuthFromLanding('MINE_MANAGER');
          }
        }} />

        {/* Initial Authentication Modal */}
        <SSOModal
          isOpen={isSSOOpen}
          onClose={() => setIsSSOOpen(false)}
          initialRole={ssoInitialRole}
          onLogin={handleLoginSuccess}
        />

        {/* DGMS Gazette Circulars Modal */}
        {isCircularModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden">
              <div className="bg-[#004D40] text-white px-5 py-3 flex items-center justify-between border-b border-[#00382E]">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-amber-300" />
                  <div>
                    <h3 className="font-bold text-sm text-white">DGMS Official Gazette Directive</h3>
                    <p className="text-[10px] text-emerald-200">Directorate General of Mines Safety • Dhanbad</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCircularModalOpen(false)}
                  className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs text-slate-800 max-h-[70vh] overflow-y-auto">
                <div className="bg-amber-50 border border-amber-300 p-3 rounded text-amber-950 font-medium">
                  <strong>Notification No:</strong> DGMS/S&amp;T/Circular/2026/04 — Mandatory digital slope telemetry and biometric workforce verification under CMR 2017.
                </div>
                <p className="leading-relaxed">
                  In exercise of powers under Section 22 of Mines Act 1952, DGMS mandates real-time digital logging of opencast bench stability parameters across all Coal India subsidiaries.
                </p>
              </div>

              <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setIsCircularModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsCircularModalOpen(false);
                    handleOpenAuthFromLanding('MINE_MANAGER');
                  }}
                  className="px-4 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold rounded flex items-center space-x-1.5"
                >
                  <span>Verify Login &amp; Proceed</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Authenticated Portal Shell
  return (
    <div className={`min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 ${getFontSizeClass()}`}>
      {/* Top Institutional Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        shift={shift}
        onShiftChange={setShift}
        accessibility={accessibility}
        onAccessibilityChange={setAccessibility}
        onNavigateHome={() => setActivePage('dashboard')}
        onOpenStatutoryManual={() => setIsStatutoryManualOpen(true)}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        activePage={activePage}
        onSelectPage={setActivePage}
      />

      {/* Main Operational Body with Left-Hand Navigation */}
      <div className="flex-1 flex flex-row overflow-hidden">
        <Navigation
          activePage={activePage}
          onSelectPage={(page) => {
            if (page === 'landing') {
              setActivePage('landing');
            } else {
              setActivePage(page);
            }
          }}
          onExitToLanding={() => setActivePage('landing')}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenNewComplaint={() => setIsNewComplaintOpen(true)}
          onOpenStatutoryManual={() => setIsStatutoryManualOpen(true)}
          onOpenAuditLog={() => setIsAuditLogOpen(true)}
        />

        {/* Right-Hand Main Operational Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F4F7F5] flex flex-col justify-between">
          <div className="flex-1">
            {activePage === 'dashboard' && (
              <GovernanceDashboard onNavigate={setActivePage} />
            )}

            {activePage === 'statutory' && (
              <StatutoryCompliance />
            )}

            {activePage === 'gis' && (
              <GISMonitoring onNavigate={setActivePage} />
            )}

            {activePage === 'inspection' && (
              <FieldInspection />
            )}

            {(activePage === 'airisk' || activePage === 'ai-risk' || activePage === 'governance-overview') && (
              <GovernanceOverview onNavigate={setActivePage} />
            )}

            {(activePage === 'contractor' || activePage === 'contractors') && (
              <ContractorWorkforce />
            )}

            {activePage === 'reports' && (
              <StatutoryReports onNavigate={setActivePage} />
            )}

            {activePage === 'document-intelligence' && (
              <DocumentIntelligence onNavigate={setActivePage} />
            )}

            {(activePage === 'production-operations' || activePage === 'production') && (
              <ProductionOperations onNavigate={setActivePage} />
            )}

            {activePage === 'regulatory-oversight' && (
              <RegulatoryOversight onNavigate={setActivePage} />
            )}
          </div>

          {/* Official NIC / DGMS Footer */}
          <Footer onNavigate={(page) => {
            if (page === 'landing') {
              setActivePage('landing');
            } else {
              setActivePage(page);
            }
          }} />
        </main>
      </div>

      {/* 3. Global Modal Systems */}
      {/* A. True RBAC Password-Protected Role Switch with Cryptographic Audit Logging */}
      <RoleSwitchModal />

      {/* B. New Safety Hazard Filing Modal */}
      {isNewComplaintOpen && (
        <NewComplaintModal
          onClose={() => setIsNewComplaintOpen(false)}
          initialMineId={activeRoleProfile.mineId}
        />
      )}

      {/* C. CMR 2017 & Mines Act 1952 Reference Modal */}
      {isStatutoryManualOpen && (
        <CMRReferenceModal
          isOpen={isStatutoryManualOpen}
          onClose={() => setIsStatutoryManualOpen(false)}
        />
      )}

      {/* D. Role Access & Switch Audit Ledger Modal */}
      {isAuditLogOpen && (
        <RoleAuditLogModal
          onClose={() => setIsAuditLogOpen(false)}
        />
      )}

      {/* E. Step 4b — Voice "Jarvis" duty assistant, available on every
          authenticated page, small/collapsed by default. */}
      <DutyVoiceAssistant />
    </div>
  );
}

export default function App() {
  return (
    <GovernanceProvider>
      <AppContent />
    </GovernanceProvider>
  );
}
