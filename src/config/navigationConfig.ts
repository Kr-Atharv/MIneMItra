import {
  LayoutDashboard,
  ClipboardCheck,
  MapPin,
  Activity,
  FileCheck2,
  FileSpreadsheet,
  Users,
  BrainCircuit,
  ScanText,
  Landmark,
  LucideIcon
} from 'lucide-react';
import { PageId, AppRole } from '../types';

export type NavGroup = 'Operations' | 'Compliance' | 'Intelligence & AI' | 'Governance';

export interface NavigationItem {
  id: PageId;
  label: string | Partial<Record<AppRole, string>>;
  shortLabel: string | Partial<Record<AppRole, string>>;
  icon: LucideIcon;
  badge?: string | ((role: AppRole, ctx: { complaintCount: number }) => string | undefined);
  badgeColor?: string | ((role: AppRole) => string | undefined);
  roles: AppRole[];
  group: NavGroup;
}

export const NAVIGATION_GROUPS: NavGroup[] = [
  'Operations',
  'Compliance',
  'Intelligence & AI',
  'Governance'
];

export const NAVIGATION_REGISTRY: NavigationItem[] = [
  // -------------------------------------------------------------
  // Operations Group
  // -------------------------------------------------------------
  {
    id: 'dashboard',
    label: 'Governance Dashboard',
    shortLabel: 'Dashboard',
    icon: LayoutDashboard,
    badge: (role, ctx) => {
      if (role === 'safety_officer') return `${ctx.complaintCount} Active`;
      if (role === 'field_inspector') return `${ctx.complaintCount} Pending`;
      if (role === 'maintenance_officer') return `${ctx.complaintCount} Orders`;
      if (role === 'audit_compliance_officer') return `${ctx.complaintCount} To Verify`;
      if (role === 'corporate_director') return '8 Subs';
      if (role === 'regulatory_authority') return 'Pan-India';
      return undefined;
    },
    badgeColor: (role) => {
      if (role === 'field_inspector' || role === 'maintenance_officer') return 'bg-amber-600 text-white';
      if (role === 'audit_compliance_officer') return 'bg-indigo-700 text-white';
      return 'bg-emerald-700 text-white';
    },
    roles: [
      'safety_officer',
      'field_inspector',
      'maintenance_officer',
      'audit_compliance_officer',
      'corporate_director',
      'regulatory_authority'
    ],
    group: 'Operations'
  },
  {
    id: 'production-operations',
    label: 'Production & HEMM Dispatch',
    shortLabel: 'Production',
    icon: Activity,
    badge: 'Shift Logs',
    badgeColor: 'bg-emerald-800 text-white',
    roles: [
      'safety_officer',
      'maintenance_officer',
      'corporate_director',
      'regulatory_authority'
    ],
    group: 'Operations'
  },
  {
    id: 'inspection',
    label: 'Field Inspection',
    shortLabel: 'Inspection',
    icon: ClipboardCheck,
    badge: (role) => {
      if (role === 'safety_officer') return 'Stage 1-5';
      if (role === 'field_inspector') return 'On-Site';
      if (role === 'maintenance_officer') return 'Repairs';
      if (role === 'audit_compliance_officer') return 'Sign-off';
      if (role === 'regulatory_authority') return 'Sec 22';
      return undefined;
    },
    badgeColor: (role) => {
      if (role === 'maintenance_officer') return 'bg-amber-700 text-white';
      return 'bg-blue-700 text-white';
    },
    roles: [
      'safety_officer',
      'field_inspector',
      'maintenance_officer',
      'audit_compliance_officer',
      'regulatory_authority'
    ],
    group: 'Operations'
  },
  {
    id: 'gis',
    label: 'GIS Monitoring',
    shortLabel: 'GIS Map',
    icon: MapPin,
    badge: (role) => {
      if (role === 'field_inspector') return 'RTK +/-1m';
      if (role === 'maintenance_officer') return 'Haulway';
      if (role === 'corporate_director') return '377 Mines';
      return 'Live';
    },
    badgeColor: (role) => {
      if (role === 'corporate_director') return 'bg-blue-700 text-white';
      return 'bg-teal-700 text-white';
    },
    roles: [
      'safety_officer',
      'field_inspector',
      'maintenance_officer',
      'corporate_director',
      'regulatory_authority'
    ],
    group: 'Operations'
  },

  // -------------------------------------------------------------
  // Compliance Group
  // -------------------------------------------------------------
  {
    id: 'statutory',
    label: 'Statutory Compliance',
    shortLabel: 'Compliance',
    icon: FileCheck2,
    badge: (role) => {
      if (role === 'field_inspector') return 'Gazette';
      if (role === 'maintenance_officer') return 'Mandatory';
      if (role === 'audit_compliance_officer') return 'Law';
      return 'National';
    },
    badgeColor: 'bg-emerald-700 text-white',
    roles: [
      'field_inspector',
      'maintenance_officer',
      'audit_compliance_officer',
      'corporate_director',
      'regulatory_authority'
    ],
    group: 'Compliance'
  },
  {
    id: 'reports',
    label: 'Statutory Reports',
    shortLabel: 'Reports',
    icon: FileSpreadsheet,
    badge: (role) => {
      if (role === 'safety_officer') return 'CMR 35';
      if (role === 'field_inspector') return 'Statutory';
      if (role === 'maintenance_officer') return 'Signed';
      if (role === 'audit_compliance_officer') return 'Prosecution';
      if (role === 'corporate_director') return 'Critical';
      return 'Gazette';
    },
    badgeColor: (role) => {
      if (role === 'corporate_director') return 'bg-red-700 text-white';
      return 'bg-slate-700 text-white';
    },
    roles: [
      'safety_officer',
      'field_inspector',
      'maintenance_officer',
      'audit_compliance_officer',
      'corporate_director',
      'regulatory_authority'
    ],
    group: 'Compliance'
  },
  {
    id: 'contractor',
    label: 'Contractor & Workforce',
    shortLabel: 'Workforce',
    icon: Users,
    badge: (role) => {
      if (role === 'safety_officer') return 'Biometric';
      if (role === 'audit_compliance_officer') return 'SHA-256';
      return '84k Tracked';
    },
    badgeColor: (role) => {
      if (role === 'audit_compliance_officer') return 'bg-indigo-800 text-white';
      return 'bg-slate-700 text-white';
    },
    roles: [
      'safety_officer',
      'audit_compliance_officer',
      'corporate_director',
      'regulatory_authority'
    ],
    group: 'Compliance'
  },

  // -------------------------------------------------------------
  // Intelligence & AI Group
  // -------------------------------------------------------------
  {
    id: 'governance-overview',
    label: 'AI Analytics Dashboard',
    shortLabel: 'AI Analytics',
    icon: BrainCircuit,
    badge: (role) => {
      if (role === 'safety_officer' || role === 'maintenance_officer') return 'Mine';
      if (role === 'field_inspector') return 'Field';
      if (role === 'audit_compliance_officer') return 'National';
      return 'Executive';
    },
    badgeColor: 'bg-teal-800 text-white',
    roles: [
      'safety_officer',
      'field_inspector',
      'maintenance_officer',
      'audit_compliance_officer',
      'corporate_director',
      'regulatory_authority'
    ],
    group: 'Intelligence & AI'
  },
  {
    id: 'document-intelligence',
    label: 'Document Intelligence OCR',
    shortLabel: 'Documents',
    icon: ScanText,
    badge: 'OCR',
    badgeColor: 'bg-emerald-800 text-white',
    roles: [
      'safety_officer',
      'field_inspector',
      'maintenance_officer',
      'audit_compliance_officer',
      'corporate_director',
      'regulatory_authority'
    ],
    group: 'Intelligence & AI'
  },
  // -------------------------------------------------------------
  // Governance Group (Step 1c)
  // -------------------------------------------------------------
  {
    id: 'regulatory-oversight',
    label: 'Regulatory Oversight',
    shortLabel: 'Regulator',
    icon: Landmark,
    badge: 'Read-Only',
    badgeColor: 'bg-slate-700 text-white',
    // Visible only to the external Regulatory Authority role — this is
    // its dedicated, purpose-built, read-only destination (Step 1c).
    roles: ['regulatory_authority'],
    group: 'Governance'
  }
];

export function resolveItemLabel(item: NavigationItem, role: AppRole): string {
  if (typeof item.label === 'string') return item.label;
  return item.label[role] || (typeof item.shortLabel === 'string' ? item.shortLabel : item.id);
}

export function resolveItemShortLabel(item: NavigationItem, role: AppRole): string {
  if (typeof item.shortLabel === 'string') return item.shortLabel;
  return item.shortLabel[role] || resolveItemLabel(item, role);
}

export function resolveItemBadge(
  item: NavigationItem,
  role: AppRole,
  ctx: { complaintCount: number }
): string | undefined {
  if (!item.badge) return undefined;
  if (typeof item.badge === 'string') return item.badge;
  return item.badge(role, ctx);
}

export function resolveItemBadgeColor(item: NavigationItem, role: AppRole): string {
  if (!item.badgeColor) return 'bg-emerald-100 text-emerald-800';
  if (typeof item.badgeColor === 'string') return item.badgeColor;
  return item.badgeColor(role) || 'bg-emerald-100 text-emerald-800';
}
