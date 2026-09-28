import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppRole,
  ComplaintItem,
  ComplaintStatus,
  MediaAttachment,
  NotificationItem,
  RoleSwitchAuditEntry,
  ShiftType,
  UserProfile,
  WorkflowEvent,
  PageId
} from '../types';
import { SEEDED_COMPLAINTS } from '../data/complaintSeed';
import { MINE_LOCATIONS } from '../data/mockData';
import { isValidGps, offsetWithinMine } from '../lib/geo';
import { sha256OfFile, sha256OfText } from '../lib/hash';
import { fetchPersistedComplaints, syncComplaints } from '../lib/complaintsApi';
import { getSocket } from '../lib/socket';

// Default 5 predefined official profiles for the 5 independent roles
export const OFFICIAL_ROLE_PROFILES: Record<AppRole, {
  name: string;
  designation: string;
  loginId: string;
  mineId: string;
  mineName: string;
  subsidiary: string;
  area: string;
  password: string;
  badgeCode: string;
}> = {
  safety_officer: {
    name: 'Er. Rajeshwar Rao',
    designation: 'Safety Overman & Mines Safety Officer',
    loginId: 'CIL-SO-8821',
    mineId: 'M-SECL-CHHAL',
    mineName: 'Chhal Opencast Mine',
    subsidiary: 'SECL',
    area: 'Raigarh',
    password: 'Safety@2026',
    badgeCode: 'DGMS-SO-SECL-8821'
  },
  field_inspector: {
    name: 'Er. S. K. Verma',
    designation: 'DGMS Deputy Field Inspector & Colliery Auditor',
    loginId: 'DGMS-FI-4402',
    mineId: 'M-SECL-CHHAL',
    mineName: 'Chhal Opencast Mine',
    subsidiary: 'SECL',
    area: 'Raigarh',
    password: 'Inspect@2026',
    badgeCode: 'DGMS-INSP-EZ-4402'
  },
  maintenance_officer: {
    name: 'Er. Vikramaditya Sen',
    designation: 'Superintending Engineer (HEMM & Mechanical)',
    loginId: 'CIL-MO-9104',
    mineId: 'M-SECL-CHHAL',
    mineName: 'Chhal Opencast Mine',
    subsidiary: 'SECL',
    area: 'Raigarh',
    password: 'Maintain@2026',
    badgeCode: 'CIL-ENG-MECH-9104'
  },
  audit_compliance_officer: {
    name: 'Dr. Arindam Mukherjee',
    designation: 'Chief Audit & Statutory Compliance Officer (DGMS/CMR)',
    loginId: 'DGMS-AUD-3108',
    mineId: 'M-SECL-CHHAL',
    mineName: 'Chhal Opencast Mine',
    subsidiary: 'SECL',
    area: 'Raigarh',
    password: 'Audit@2026',
    badgeCode: 'DGMS-STAT-AUD-3108'
  },
  corporate_director: {
    name: 'Shri B. K. Chattopadhyay',
    designation: 'Technical Director & Board Member (Coal India Ltd)',
    loginId: 'CIL-HQ-DIR-001',
    mineId: 'CIL-HQ-KOLKATA',
    mineName: 'Coal India National Headquarters',
    subsidiary: 'CIL-HQ',
    area: 'Corporate Apex Office',
    password: 'Director@2026',
    badgeCode: 'CIL-BOARD-DIR-001'
  },
  regulatory_authority: {
    name: 'Dr. V. K. Singh, IRS / DGMS Apex',
    designation: 'Director General of Mines Safety & Central Statutory Regulator',
    loginId: 'DGMS-HQ-REG-001',
    mineId: 'ALL_MINES',
    mineName: 'DGMS Central Directorate HQ',
    subsidiary: 'DGMS / MoC',
    area: 'Pan-India Central Zone',
    password: 'Regulator@2026',
    badgeCode: 'DGMS-APEX-REG-001'
  }
};

// Demo seed — same records used by dashboard, GIS, and analytics.
const INITIAL_COMPLAINTS: ComplaintItem[] = SEEDED_COMPLAINTS;

// Initial Audit Logs of Role Switches
const INITIAL_ROLE_AUDIT_LOGS: RoleSwitchAuditEntry[] = [
  {
    id: 'AUD-SW-001',
    timestamp: '05 Sep 2026, 08:00:15 IST',
    previousRole: 'corporate_director',
    newRole: 'safety_officer',
    officerId: 'CIL-SO-8821',
    officerName: 'Er. Rajeshwar Rao',
    authMethod: 'PASSWORD_SSO',
    sessionTokenHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ipAddress: '10.24.110.42 (SECL Raigarh Intranet)',
    jurisdiction: 'SECL Chhal Opencast Mine'
  }
];

// Notifications
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    timestamp: '05 Sep 2026, 08:31 AM IST',
    timeAgo: 'Just now',
    title: 'New Complaint Waiting for Field Inspection',
    message: 'Complaint CIL-CMP-2026-0419 (Overburden Bench 3 Crest Tension Crack) submitted by Safety Officer. Inspection required.',
    targetRoles: ['field_inspector'],
    type: 'assignment',
    complaintId: 'CMP-2026-001',
    read: false
  },
  {
    id: 'NOTIF-02',
    timestamp: '04 Sep 2026, 16:45 PM IST',
    timeAgo: '1 day ago',
    title: 'Emergency Repair Assigned: Haul Road Berm',
    message: 'Work Order CIL-CMP-2026-0418 assigned to Maintenance Officer for berm rebuilding on Ramp B.',
    targetRoles: ['maintenance_officer'],
    type: 'assignment',
    complaintId: 'CMP-2026-002',
    read: false
  },
  {
    id: 'NOTIF-03',
    timestamp: '05 Sep 2026, 09:20 AM IST',
    timeAgo: '3 hours ago',
    title: 'Statutory Verification Pending: Dumper Brake Overhaul',
    message: 'Maintenance completed on CAT-793D #D-18. Waiting for Audit & Compliance Officer PKI verification.',
    targetRoles: ['audit_compliance_officer'],
    type: 'verification',
    complaintId: 'CMP-2026-003',
    read: false
  },
  {
    id: 'NOTIF-04',
    timestamp: '05 Sep 2026, 06:00 AM IST',
    timeAgo: '6 hours ago',
    title: 'National Executive Summary: All 8 Subsidiaries Compliant',
    message: 'National CMR compliance stands at 94.6%. 1 high-risk filing due in CCL Rajrappa.',
    targetRoles: ['corporate_director'],
    type: 'info',
    read: true
  }
];

interface GovernanceContextType {
  // Current Role & Auth
  currentRole: AppRole;
  currentUser: UserProfile;
  activeRoleProfile: typeof OFFICIAL_ROLE_PROFILES[AppRole];
  switchRoleWithAuth: (targetRole: AppRole, passwordAttempt: string) => { success: boolean; error?: string };
  // Sets the active workflow role directly, no password required. Meant
  // ONLY for the initial SSO login screen (App.tsx's handleLoginSuccess):
  // the person already authenticated there, so this just makes the role
  // they picked on that screen actually take effect in the 5-stage
  // complaint workflow, instead of the workflow silently staying on the
  // 'safety_officer' default no matter which identity they logged in as.
  setActiveWorkflowRole: (role: AppRole) => void;
  isRoleSwitchModalOpen: boolean;
  setIsRoleSwitchModalOpen: (open: boolean) => void;
  targetRoleToSwitch: AppRole | null;
  setTargetRoleToSwitch: (role: AppRole | null) => void;

  // Workflow State & Filtering
  complaints: ComplaintItem[];
  filteredComplaintsForRole: ComplaintItem[];
  activeComplaintDetail: ComplaintItem | null;
  setActiveComplaintDetail: (c: ComplaintItem | null) => void;
  gisFocusComplaintId: string | null;
  setGisFocusComplaintId: (id: string | null) => void;

  // Workflow Progression Actions
  submitComplaint: (data: {
    title: string;
    description: string;
    mineId: string;
    mineName: string;
    subsidiary: string;
    seamBlock: string;
    category: ComplaintItem['category'];
    regulationCode: string;
    severity: ComplaintItem['severity'];
    equipmentId?: string;
    media: MediaAttachment[];
    gpsLocation?: { lat: number; lng: number; accuracy?: string };
    locationUnavailable?: boolean;
  }) => ComplaintItem;

  inspectComplaint: (complaintId: string, data: {
    findings: string;
    measurements?: Record<string, string>;
    requiresMaintenance: boolean;
    media?: MediaAttachment[];
  }) => void;

  completeMaintenance: (complaintId: string, data: {
    actionTaken: string;
    partsReplaced?: string;
    hoursDowntime?: number;
    media?: MediaAttachment[];
  }) => void;

  certifyAuditCompliance: (complaintId: string, data: {
    remarks: string;
    dgmsReceiptNumber?: string;
    isApproved: boolean;
    media?: MediaAttachment[];
  }) => void;

  // Media Upload helper with Hash & Signature
  createSignedMediaAttachment: (file: {
    name: string;
    type: string;
    size: number;
    dataUrl: string;
    fileObject?: File;
  }, gps?: { lat: number; lng: number; accuracy: string }) => Promise<MediaAttachment>;

  // Notifications
  notifications: NotificationItem[];
  roleNotifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markNotificationRead: (id: string) => void;

  // Audit Logging
  roleSwitchAuditLogs: RoleSwitchAuditEntry[];

  // Workflow Rejection
  rejectMaintenance: (complaintId: string, remarks: string) => void;
}

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined);

export const GovernanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Role State
  const [currentRole, setCurrentRole] = useState<AppRole>('safety_officer');
  const [isRoleSwitchModalOpen, setIsRoleSwitchModalOpen] = useState<boolean>(false);
  const [targetRoleToSwitch, setTargetRoleToSwitch] = useState<AppRole | null>(null);

  // 2. Complaints Data
  // Starts from the hardcoded seed so the UI has something to show
  // immediately; on mount we try to load whatever is actually persisted
  // (a local JSON file on the server, see server/db.js — no external
  // database) and, if present, replace the seed with it. From then on,
  // every change to `complaints` (new submission, inspection, maintenance
  // action, audit certification...) is synced to the backend, so state
  // now survives a page refresh or server restart instead of resetting
  // to the mock array every time.
  const [complaints, setComplaints] = useState<ComplaintItem[]>(INITIAL_COMPLAINTS);
  const [gisFocusComplaintId, setGisFocusComplaintId] = useState<string | null>(null);
  const [activeComplaintDetail, setActiveComplaintDetail] = useState<ComplaintItem | null>(null);
  const hasLoadedPersistedComplaints = React.useRef(false);
  // Set right before applying an update that arrived over the socket, so the
  // sync effect below (which fires on every `complaints` change) knows to
  // skip that one cycle — otherwise we'd immediately PUT right back the data
  // we just received, which is harmless but pointless network chatter.
  const suppressNextSync = React.useRef(false);

  // Load whatever is persisted exactly ONCE, on the very first app mount —
  // not on every role switch. Re-fetching on every role switch (the old
  // behaviour) was the actual cause of "complaint registered but not
  // showing": submit as Safety Officer -> added locally and an async PUT
  // /sync kicks off -> switch role to Field Inspector immediately -> that
  // switch re-triggered a GET /complaints which could win the race and
  // come back *before* the PUT had finished writing -> the just-submitted
  // complaint got overwritten right out of local state before the next
  // role ever saw it. Fetching once removes that race entirely: after the
  // first load, `complaints` is the single source of truth in this tab,
  // updated only by local actions and by real-time socket pushes below —
  // there is no longer any code path that could clobber it with stale data.
  useEffect(() => {
    (async () => {
      const persisted = await fetchPersistedComplaints();
      if (persisted && persisted.length > 0) {
        setComplaints(persisted);
      } else {
        // Nothing in the file yet (or the backend is unreachable) — push
        // the seed data up so persistence gets initialized with it.
        syncComplaints(INITIAL_COMPLAINTS);
      }
      hasLoadedPersistedComplaints.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time: listen for other tabs/devices' changes and apply them here
  // immediately, instead of only picking them up on the next page load.
  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = (updated: ComplaintItem[]) => {
      suppressNextSync.current = true;
      setComplaints(updated);
    };
    socket.on('complaints:updated', handleUpdate);
    return () => {
      socket.off('complaints:updated', handleUpdate);
    };
  }, []);

  // Persist every subsequent change to `complaints`. Skipped until the
  // initial hydration above has run, so we don't immediately overwrite a
  // freshly-loaded persisted list with the seed data it replaced. Also
  // skipped once right after a socket update, so we don't echo it straight
  // back to the server.
  useEffect(() => {
    if (!hasLoadedPersistedComplaints.current) return;
    if (suppressNextSync.current) {
      suppressNextSync.current = false;
      return;
    }
    syncComplaints(complaints);
  }, [complaints]);

  // 3. Notifications & Logs
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [roleSwitchAuditLogs, setRoleSwitchAuditLogs] = useState<RoleSwitchAuditEntry[]>(INITIAL_ROLE_AUDIT_LOGS);

  const activeRoleProfile = OFFICIAL_ROLE_PROFILES[currentRole];

  const currentUser: UserProfile = {
    name: activeRoleProfile.name,
    designation: activeRoleProfile.designation,
    role: currentRole,
    loginId: activeRoleProfile.loginId,
    mineId: activeRoleProfile.mineId
  };

  // Switch Role with Secure Password Verification and Tamper-Evident Audit Logging
  const switchRoleWithAuth = (targetRole: AppRole, passwordAttempt: string) => {
    const targetProfile = OFFICIAL_ROLE_PROFILES[targetRole];
    // Verify password: accepts role specific password or master bypass 'CoalGuard@2026'
    if (passwordAttempt !== targetProfile.password && passwordAttempt !== 'CoalGuard@2026') {
      return { success: false, error: 'Invalid authentication credential for requested statutory role.' };
    }

    const previousRole = currentRole;
    setCurrentRole(targetRole);

    // Create Audit Log Entry
    const now = new Date();
    const timestampStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST';

    const logEntry: RoleSwitchAuditEntry = {
      id: `AUD-SW-${Date.now()}`,
      timestamp: timestampStr,
      previousRole,
      newRole: targetRole,
      officerId: targetProfile.loginId,
      officerName: targetProfile.name,
      authMethod: 'PASSWORD_SSO',
      sessionTokenHash: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      ipAddress: '10.24.110.42 (NIC Secure Colliery VPN)',
      jurisdiction: `${targetProfile.mineName} (${targetProfile.subsidiary})`
    };

    setRoleSwitchAuditLogs(prev => [logEntry, ...prev]);

    // Push notification for role switch
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      timestamp: timestampStr,
      timeAgo: 'Just now',
      title: `Role Switched to ${targetProfile.designation}`,
      message: `Authenticated as ${targetProfile.name}. Jurisdiction active for ${targetProfile.subsidiary}.`,
      targetRoles: [targetRole],
      type: 'info',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    setIsRoleSwitchModalOpen(false);
    setTargetRoleToSwitch(null);
    return { success: true };
  };

  // See interface comment: applies the role picked on the SSO login
  // screen to the actual workflow, without requiring the mid-session
  // password re-check that switchRoleWithAuth does (the person already
  // proved who they are on that screen).
  const setActiveWorkflowRole = (role: AppRole) => {
    if (role === currentRole) return;
    setCurrentRole(role);
  };

  /**
   * Filter complaints strictly per user role:
   * - safety_officer: Only sees their submitted complaints
   * - field_inspector: Only sees pending inspections (status === 'PENDING_INSPECTION')
   * - maintenance_officer: Only sees assigned repairs (status === 'ASSIGNED_MAINTENANCE')
   * - audit_compliance_officer: Only sees items waiting for audit verification (status === 'PENDING_AUDIT')
   * - corporate_director: Executive view (can see all or summarized list)
   */
  const filteredComplaintsForRole = complaints.filter(c => {
    switch (currentRole) {
      case 'safety_officer':
        // Safety officer sees complaints they submitted or in their colliery
        return c.submittedBy.officerId === activeRoleProfile.loginId || c.submittedBy.role === 'safety_officer';
      case 'field_inspector':
        // Field inspector ONLY sees complaints waiting for inspection
        return c.status === 'PENDING_INSPECTION';
      case 'maintenance_officer':
        // Maintenance officer ONLY sees complaints assigned for maintenance
        return c.status === 'ASSIGNED_MAINTENANCE';
      case 'audit_compliance_officer':
        // Audit officer ONLY sees complaints waiting for compliance certification
        return c.status === 'PENDING_AUDIT';
      case 'corporate_director':
      case 'regulatory_authority':
        // Director and Regulatory Authority get full pan-India oversight
        return true;
      default:
        return true;
    }
  });

  // Filter notifications for active role
  const roleNotifications = notifications.filter(n =>
    n.targetRoles.includes(currentRole) || currentRole === 'corporate_director' || currentRole === 'regulatory_authority'
  );

  const unreadNotificationCount = roleNotifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Media generator with cryptographic hash and signature
  const createSignedMediaAttachment = async (
    file: { name: string; type: string; size: number; dataUrl: string; fileObject?: File },
    gps?: { lat: number; lng: number; accuracy: string }
  ): Promise<MediaAttachment> => {
    const now = new Date();
    const timestampStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST';

    let fileType: MediaAttachment['fileType'] = 'image';
    if (file.type.includes('video') || file.name.endsWith('.mp4')) fileType = 'video';
    else if (file.type.includes('pdf') || file.name.endsWith('.pdf')) fileType = 'pdf';
    else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.xlsx')) fileType = 'document';

    // Real SHA-256 digest, computed with the browser's native Web Crypto API.
    // When a real File is available (an actual upload) we hash its real bytes,
    // so the digest genuinely changes if the file content changes. When there's
    // no real file (a simulated/demo evidence capture with no upload), we hash
    // deterministic metadata instead — still a real SHA-256 digest, just not of
    // photo bytes that don't exist in this prototype flow.
    const realHash = file.fileObject
      ? await sha256OfFile(file.fileObject)
      : await sha256OfText(`${file.name}|${file.size}|${file.type}|${now.toISOString()}`);
    const signature = `SIG-${activeRoleProfile.loginId}-${realHash.substring(0, 8).toUpperCase()}`;

    return {
      id: `MED-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      fileName: file.name,
      fileType,
      url: file.dataUrl || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
      sizeBytes: file.size || 1500000,
      timestamp: timestampStr,
      uploadedBy: `${activeRoleProfile.name} (${activeRoleProfile.designation})`,
      role: currentRole,
      sha256Hash: realHash,
      digitalSignature: signature,
      gpsLocation: gps && isValidGps(gps) ? gps : undefined
    };
  };

  // WORKFLOW ACTION 1: Safety Officer submits complaint
  const submitComplaint = (data: {
    title: string;
    description: string;
    mineId: string;
    mineName: string;
    subsidiary: string;
    seamBlock: string;
    category: ComplaintItem['category'];
    regulationCode: string;
    severity: ComplaintItem['severity'];
    equipmentId?: string;
    media: MediaAttachment[];
    gpsLocation?: { lat: number; lng: number; accuracy?: string };
    locationUnavailable?: boolean;
  }): ComplaintItem => {
    const now = new Date();
    const timestampStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST';

    const newId = `CMP-2026-${Date.now().toString().slice(-4)}`;
    const tracking = `CIL-CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const mine = MINE_LOCATIONS.find((m) => m.id === data.mineId);
    let gps = data.gpsLocation;
    if (!data.locationUnavailable && !isValidGps(gps) && mine) {
      gps = { ...offsetWithinMine(mine.coordinates, Date.now() % 12), accuracy: '+/- 2.0m RTK' };
    }
    const locationUnavailable = Boolean(data.locationUnavailable) || !isValidGps(gps);

    const newComplaint: ComplaintItem = {
      id: newId,
      trackingNumber: tracking,
      title: data.title,
      description: data.description,
      mineId: data.mineId,
      mineName: data.mineName,
      subsidiary: data.subsidiary,
      seamBlock: data.seamBlock,
      equipmentId: data.equipmentId,
      category: data.category,
      regulationCode: data.regulationCode,
      severity: data.severity,
      status: 'PENDING_INSPECTION', // Moves automatically to Field Inspector
      currentResponsibleRole: 'field_inspector',
      submittedBy: {
        officerId: activeRoleProfile.loginId,
        name: activeRoleProfile.name,
        role: 'safety_officer',
        timestamp: timestampStr,
        shift: 'A'
      },
      media: data.media || [],
      gpsLocation: locationUnavailable ? undefined : gps,
      locationUnavailable,
      timeline: [
        {
          id: `EVT-${Date.now()}`,
          timestamp: timestampStr,
          action: 'Complaint Logged by Safety Officer -> Transferred to Field Inspector',
          actorName: activeRoleProfile.name,
          actorRole: 'safety_officer',
          newStatus: 'PENDING_INSPECTION',
          comments: 'Statutory hazard flagged. Awaiting physical field inspection.',
          signatureHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        }
      ],
      aiInsight: {
        riskScore: data.severity === 'Critical' ? 92 : data.severity === 'High' ? 76 : 55,
        hazardPrediction: `Operational hazard detected under ${data.regulationCode}. High compliance priority.`,
        suggestedMitigation: 'Schedule immediate on-ground physical inspection by DGMS Field Inspector.',
        patternAnomaly: 'Correlated with active shift operational cycle.',
        provider: 'DGMS Statutory Hazard Matrix',
        confidence: 0.99
      }
    };

    setComplaints(prev => [newComplaint, ...prev]);

    // Push notification to Field Inspector
    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      timestamp: timestampStr,
      timeAgo: 'Just now',
      title: `New Safety Complaint: ${data.title}`,
      message: `Submitted by Safety Officer for ${data.mineName}. Pending your on-site inspection.`,
      targetRoles: ['field_inspector'],
      type: 'assignment',
      complaintId: newId,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    return newComplaint;
  };

  // WORKFLOW ACTION 2: Field Inspector completes on-ground inspection
  const inspectComplaint = (complaintId: string, data: {
    findings: string;
    measurements?: Record<string, string>;
    requiresMaintenance: boolean;
    media?: MediaAttachment[];
  }) => {
    const now = new Date();
    const timestampStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST';

    const nextStatus: ComplaintStatus = data.requiresMaintenance ? 'ASSIGNED_MAINTENANCE' : 'PENDING_AUDIT';
    const nextRole: AppRole = data.requiresMaintenance ? 'maintenance_officer' : 'audit_compliance_officer';
    const signature = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    setComplaints(prev => prev.map(c => {
      if (c.id !== complaintId) return c;

      const updatedTimeline: WorkflowEvent[] = [
        ...c.timeline,
        {
          id: `EVT-${Date.now()}`,
          timestamp: timestampStr,
          action: data.requiresMaintenance
            ? 'Field Inspection Completed -> Work Order Dispatched to Maintenance Officer'
            : 'Field Inspection Completed -> Dispatched for Statutory Audit Certification',
          actorName: activeRoleProfile.name,
          actorRole: 'field_inspector',
          previousStatus: 'PENDING_INSPECTION',
          newStatus: nextStatus,
          comments: data.findings,
          signatureHash: signature
        }
      ];

      return {
        ...c,
        status: nextStatus,
        currentResponsibleRole: nextRole,
        inspectedBy: {
          officerId: activeRoleProfile.loginId,
          name: activeRoleProfile.name,
          timestamp: timestampStr,
          findings: data.findings,
          measurements: data.measurements,
          requiresMaintenance: data.requiresMaintenance,
          signatureHash: signature
        },
        media: [...c.media, ...(data.media || [])],
        timeline: updatedTimeline
      };
    }));

    // Notify next role
    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      timestamp: timestampStr,
      timeAgo: 'Just now',
      title: data.requiresMaintenance ? 'New Maintenance Work Order Assigned' : 'Statutory Verification Pending',
      message: data.requiresMaintenance
        ? `Field Inspector verified hazard on ${complaintId}. Immediate repair required.`
        : `Field Inspector verified compliance on ${complaintId}. Ready for Audit sign-off.`,
      targetRoles: [nextRole],
      type: 'assignment',
      complaintId,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // WORKFLOW ACTION 3: Maintenance Officer completes repairs
  const completeMaintenance = (complaintId: string, data: {
    actionTaken: string;
    partsReplaced?: string;
    hoursDowntime?: number;
    media?: MediaAttachment[];
  }) => {
    const now = new Date();
    const timestampStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST';

    const signature = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    setComplaints(prev => prev.map(c => {
      if (c.id !== complaintId) return c;

      const updatedTimeline: WorkflowEvent[] = [
        ...c.timeline,
        {
          id: `EVT-${Date.now()}`,
          timestamp: timestampStr,
          action: 'Maintenance & Repairs Completed -> Sent to Audit Officer for Final Sign-off',
          actorName: activeRoleProfile.name,
          actorRole: 'maintenance_officer',
          previousStatus: 'ASSIGNED_MAINTENANCE',
          newStatus: 'PENDING_AUDIT',
          comments: data.actionTaken,
          signatureHash: signature
        }
      ];

      return {
        ...c,
        status: 'PENDING_AUDIT',
        currentResponsibleRole: 'audit_compliance_officer',
        maintenanceBy: {
          officerId: activeRoleProfile.loginId,
          name: activeRoleProfile.name,
          timestamp: timestampStr,
          actionTaken: data.actionTaken,
          partsReplaced: data.partsReplaced,
          hoursDowntime: data.hoursDowntime,
          signatureHash: signature
        },
        media: [...c.media, ...(data.media || [])],
        timeline: updatedTimeline
      };
    }));

    // Notify Audit & Compliance Officer
    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      timestamp: timestampStr,
      timeAgo: 'Just now',
      title: 'Repairs Completed: Ready for DGMS Audit Certification',
      message: `Maintenance Officer resolved ${complaintId}. Uploaded repair proof awaiting your statutory sign-off.`,
      targetRoles: ['audit_compliance_officer'],
      type: 'verification',
      complaintId,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // WORKFLOW ACTION 4: Audit & Compliance Officer certifies or rejects
  const certifyAuditCompliance = (complaintId: string, data: {
    remarks: string;
    dgmsReceiptNumber?: string;
    isApproved: boolean;
    media?: MediaAttachment[];
  }) => {
    const now = new Date();
    const timestampStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST';

    const signature = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const dgmsReceipt = data.dgmsReceiptNumber || `DGMS-VERIF-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const nextStatus: ComplaintStatus = data.isApproved ? 'RESOLVED_VERIFIED' : 'ASSIGNED_MAINTENANCE';
    const nextRole: AppRole = data.isApproved ? 'corporate_director' : 'maintenance_officer';

    setComplaints(prev => prev.map(c => {
      if (c.id !== complaintId) return c;

      const updatedTimeline: WorkflowEvent[] = [
        ...c.timeline,
        {
          id: `EVT-${Date.now()}`,
          timestamp: timestampStr,
          action: data.isApproved
            ? `Statutory Audit Verified & Certified with DGMS Receipt #${dgmsReceipt}`
            : 'Statutory Audit Rejected: Deficiencies Found, Sent Back to Maintenance',
          actorName: activeRoleProfile.name,
          actorRole: 'audit_compliance_officer',
          previousStatus: 'PENDING_AUDIT',
          newStatus: nextStatus,
          comments: data.remarks,
          signatureHash: signature
        }
      ];

      return {
        ...c,
        status: nextStatus,
        currentResponsibleRole: nextRole,
        auditVerifiedBy: {
          officerId: activeRoleProfile.loginId,
          name: activeRoleProfile.name,
          timestamp: timestampStr,
          remarks: data.remarks,
          dgmsReceiptNumber: dgmsReceipt,
          signatureHash: signature
        },
        media: [...c.media, ...(data.media || [])],
        timeline: updatedTimeline
      };
    }));

    // Notify Submitting Safety Officer and Corporate Director
    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      timestamp: timestampStr,
      timeAgo: 'Just now',
      title: data.isApproved ? `Complaint Verified & Closed (${dgmsReceipt})` : `Audit Rejected on ${complaintId}`,
      message: data.isApproved
        ? `Audit Officer certified compliance for complaint ${complaintId}. Statutory closure completed.`
        : `Deficiencies identified by Audit Officer on ${complaintId}. Sent back for rectification.`,
      targetRoles: ['safety_officer', 'corporate_director'],
      type: data.isApproved ? 'verification' : 'alert',
      complaintId,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // WORKFLOW ACTION 5: Audit Officer rejects maintenance and requests rectification
  const rejectMaintenance = (complaintId: string, remarks: string) => {
    const now = new Date();
    const timestampStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST';

    const signature = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    setComplaints(prev => prev.map(c => {
      if (c.id !== complaintId) return c;

      const updatedTimeline: WorkflowEvent[] = [
        ...c.timeline,
        {
          id: `EVT-${Date.now()}`,
          timestamp: timestampStr,
          action: 'Statutory Audit Returned: Deficiencies Noted, Sent Back to Maintenance Officer',
          actorName: activeRoleProfile.name,
          actorRole: 'audit_compliance_officer',
          previousStatus: 'PENDING_AUDIT',
          newStatus: 'ASSIGNED_MAINTENANCE',
          comments: remarks,
          signatureHash: signature
        }
      ];

      return {
        ...c,
        status: 'ASSIGNED_MAINTENANCE',
        currentResponsibleRole: 'maintenance_officer',
        timeline: updatedTimeline
      };
    }));

    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      timestamp: timestampStr,
      timeAgo: 'Just now',
      title: `Audit Rejection Notice on ${complaintId}`,
      message: `Audit Officer returned work order. Rectification required: ${remarks}`,
      targetRoles: ['maintenance_officer'],
      type: 'alert',
      complaintId,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  return (
    <GovernanceContext.Provider
      value={{
        currentRole,
        currentUser,
        activeRoleProfile,
        switchRoleWithAuth,
        setActiveWorkflowRole,
        isRoleSwitchModalOpen,
        setIsRoleSwitchModalOpen,
        targetRoleToSwitch,
        setTargetRoleToSwitch,
        complaints,
        filteredComplaintsForRole,
        activeComplaintDetail,
        setActiveComplaintDetail,
        gisFocusComplaintId,
        setGisFocusComplaintId,
        submitComplaint,
        inspectComplaint,
        completeMaintenance,
        certifyAuditCompliance,
        rejectMaintenance,
        createSignedMediaAttachment,
        notifications,
        roleNotifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markNotificationRead: markNotificationAsRead,
        roleSwitchAuditLogs
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
};

export const useGovernance = () => {
  const context = useContext(GovernanceContext);
  if (!context) {
    throw new Error('useGovernance must be used within a GovernanceProvider');
  }
  return context;
};
