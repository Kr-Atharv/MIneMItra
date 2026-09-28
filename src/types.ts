export type PageId =
  | 'landing'
  | 'dashboard'
  | 'statutory'
  | 'gis'
  | 'inspection'
  | 'airisk'
  | 'ai-risk'
  | 'contractors'
  | 'contractor'
  | 'reports'
  | 'maintenance'
  | 'audit-queue'
  | 'role-audit-log'
  | 'regulatory-manual'
  | 'governance-overview'
  | 'document-intelligence'
  | 'production-operations'
  | 'production'
  | 'regulatory-oversight';

export type Language = 'en' | 'hi';
export type ShiftType = 'A' | 'B' | 'C';
export type AccessibilitySize = 'normal' | 'large' | 'xlarge';

/**
 * Statutory Roles:
 * 1. safety_officer: Safety Overman / Field Safety Officer (CMR Reg 34/35)
 * 2. field_inspector: DGMS / Colliery Field Inspector (Mines Act Sec 22)
 * 3. maintenance_officer: HEMM & Engineering In-Charge (CMR Reg 184)
 * 4. audit_compliance_officer: DGMS & CMR 2017 Statutory Auditor
 * 5. corporate_director: Coal India CMD & Technical Director
 * 6. regulatory_authority: DGMS / MoC Central Apex Regulator
 */
export type AppRole =
  | 'safety_officer'
  | 'field_inspector'
  | 'maintenance_officer'
  | 'audit_compliance_officer'
  | 'corporate_director'
  | 'regulatory_authority';

export type ComplaintStatus =
  | 'SUBMITTED'             // Stage 1: Safety Officer submitted
  | 'PENDING_INSPECTION'   // Stage 2: Field Inspector to inspect
  | 'ASSIGNED_MAINTENANCE' // Stage 3: Maintenance Officer to repair
  | 'PENDING_AUDIT'        // Stage 4: Audit Officer to certify compliance
  | 'RESOLVED_VERIFIED'    // Stage 5: Final verified closure with DGMS receipt
  | 'REJECTED';            // Sent back with deficiency notice

export interface MediaAttachment {
  id: string;
  fileName: string;
  fileType: 'image' | 'video' | 'pdf' | 'document';
  url: string;
  sizeBytes: number;
  timestamp: string;
  uploadedBy: string;
  role: AppRole;
  sha256Hash: string;
  digitalSignature: string;
  gpsLocation?: {
    lat: number;
    lng: number;
    accuracy: string;
  };
}

export interface WorkflowEvent {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: AppRole;
  previousStatus?: ComplaintStatus;
  newStatus: ComplaintStatus;
  comments?: string;
  signatureHash?: string;
  evidenceAttachments?: string[];
}

export interface ComplaintItem {
  id: string;
  trackingNumber: string; // e.g., CIL-CMP-2026-0419
  title: string;
  description: string;
  mineId: string;
  mineName: string;
  subsidiary: string; // SECL, BCCL, CCL, WCL, MCL, NCL, ECL, NEC
  seamBlock: string;
  equipmentId?: string;
  category: 'Bench Stability & Slope' | 'Ventilation & Gas' | 'Haul Road & Transport' | 'HEMM Mechanical/Electrical' | 'Explosives & Blasting' | 'Form B / Labour Welfare' | 'Environmental Compliance';
  regulationCode: string; // e.g. CMR 2017 Reg 106, CMR Reg 148
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: ComplaintStatus;
  currentResponsibleRole: AppRole;
  submittedBy: {
    officerId: string;
    name: string;
    role: AppRole;
    timestamp: string;
    shift: ShiftType;
  };
  inspectedBy?: {
    officerId: string;
    name: string;
    timestamp: string;
    findings: string;
    measurements?: Record<string, string>;
    requiresMaintenance: boolean;
    signatureHash: string;
  };
  maintenanceBy?: {
    officerId: string;
    name: string;
    timestamp: string;
    actionTaken: string;
    partsReplaced?: string;
    hoursDowntime?: number;
    signatureHash: string;
  };
  auditVerifiedBy?: {
    officerId: string;
    name: string;
    timestamp: string;
    remarks: string;
    dgmsReceiptNumber: string;
    signatureHash: string;
  };
  media: MediaAttachment[];
  timeline: WorkflowEvent[];
  aiInsight?: {
    riskScore: number;
    hazardPrediction: string;
    suggestedMitigation: string;
    patternAnomaly: string;
    provider: string;
    confidence: number;
  };
  /** Recorded field GPS for GIS. Omit or set locationUnavailable when unknown. */
  gpsLocation?: {
    lat: number;
    lng: number;
    accuracy?: string;
  };
  locationUnavailable?: boolean;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  timeAgo: string;
  title: string;
  message: string;
  targetRoles: AppRole[];
  type: 'alert' | 'assignment' | 'verification' | 'escalation' | 'info';
  complaintId?: string;
  read: boolean;
}

export interface RoleSwitchAuditEntry {
  id: string;
  timestamp: string;
  previousRole: AppRole;
  newRole: AppRole;
  officerId: string;
  officerName: string;
  authMethod: 'PASSWORD_SSO' | 'BIOMETRIC_TOKEN';
  sessionTokenHash: string;
  ipAddress: string;
  jurisdiction: string;
}

export interface StatutoryRuleClause {
  regulationNumber: string;
  title: string;
  statute: 'CMR 2017' | 'Mines Act 1952' | 'Mines Rules 1955';
  penaltyClause: string;
  responsibleOfficerRole: AppRole;
  mandatoryInspectionInterval: string;
  summary: string;
}

export interface MineLocation {
  id: string;
  name: string;
  subsidiary: string; // SECL, BCCL, CCL, WCL, MCL, NCL, NEC, ECL
  area: string;
  type: 'Opencast' | 'Underground' | 'Mixed';
  dgmsAuditScore: number;
  cmrComplianceRate: number;
  pendingInspections: number;
  riskTier: 'Low' | 'Medium' | 'High';
  activeManpower: number;
  coordinates: { lat: number; lng: number };
  firstClassManager: string;
}

export interface EscalationItem {
  id: string;
  timestamp: string;
  timeAgo: string;
  mineName: string;
  subsidiary: string;
  severity: 'Critical' | 'Warning' | 'Routine';
  type: 'Section 22 Violation' | 'Statutory Due' | 'Inspection Alert' | 'Slope Instability' | 'Gas Anomaly';
  description: string;
  regulationCode: string;
  assignedOfficer: string;
  status: 'Open' | 'Under Rectification' | 'Resolved' | 'Escalated';
  level: 1 | 2 | 3 | 4 | 5;
}

export interface StatutoryRegulation {
  id: string;
  regulationId: string; // e.g. CMR-104-VENT
  category: 'Mine Safety (CMR 2017)' | 'Environmental Clearances (MoEFCC)' | 'Explosives Handling' | 'HEMM & Machinery' | 'Labour Standards (Form B)';
  provisionDescription: string;
  applicableSeam: string;
  statutoryInCharge: string;
  dueDate: string;
  daysRemaining: number;
  hasDocument: boolean;
  documentHash: string;
  escalationLevel: 'Shift In-Charge' | 'Colliery Manager' | 'Area GM' | 'Subsidiary Technical Director';
  status: 'Overdue' | 'Due <48h' | 'Completed' | 'Verified';
  dgmsVerified: boolean;
  verificationStampDate?: string;
  timeline: {
    role: string;
    officer: string;
    status: 'completed' | 'current' | 'pending';
    slaHours: number;
    timestamp?: string;
  }[];
}

export interface GISMarker {
  id: string;
  title: string;
  mineName: string;
  benchSector: string;
  status: 'safe' | 'observation' | 'critical';
  lat: number;
  lng: number;
  xPercent: number; // for custom contour coordinate plotting
  yPercent: number;
  inspectorName: string;
  timestamp: string;
  observation: string;
  violationCode: string;
  severityText: string;
  actionPlan: string;
  assetType: 'bench' | 'haul_road' | 'sump' | 'blasting_zone' | 'sensor_gas' | 'sensor_slope';
}

export interface FieldAuditForm {
  mineId: string;
  benchSeam: string;
  category: string;
  severity: 'Routine' | 'Requires Attention' | 'Critical Violation';
  observationText: string;
  correctiveAction: string;
  assigneeDepartment: string;
  gpsCoords: string;
  accuracy: string;
  shift: ShiftType;
  timestamp: string;
  officerName: string;
  officerDesignation: string;
  photoAttached: boolean;
  hasSignature: boolean;
}

export interface ContractorRecord {
  id: string;
  vendorName: string;
  workOrderNumber: string;
  allocatedSeam: string;
  mineSite: string;
  deployedLabourCount: number;
  biometricAttendancePercent: number;
  safetyInductionPercent: number;
  formBRegisterStatus: 'Compliant' | 'Pending Verification' | 'Non-Compliant';
  dgmsVtCertificateValid: boolean;
  activeInfractionPoints: number;
  status: 'Authorized' | 'Temporarily Suspended';
  rating: number;
}

export interface WorkerRecord {
  id: string;
  passId: string;
  name: string;
  aadhaarMasked: string;
  contractorName: string;
  trade: 'HEMM Operator' | 'Blaster' | 'Dumper Operator' | 'Mining Sirdar' | 'Loader' | 'Fitter';
  pmeExpiryDate: string;
  pmeStatus: 'Valid' | 'Expiring Soon' | 'Expired';
  hemmLicense: string;
  vtTrainingDate: string;
  attendancePresent: boolean;
}

export interface StatutoryReportItem {
  id: string;
  code: string;
  title: string;
  frequency: 'Annual' | 'Monthly' | 'Quarterly' | 'Immediate';
  legalMandate: string;
  dueDate: string;
  status: 'Pending Signature' | 'DGMS Verified' | 'Draft Ready';
  submissionHash?: string;
  lastSubmittingOfficer?: string;
  receiptNumber?: string;
}

export interface AuditLedgerEntry {
  id: string;
  documentName: string;
  submittingOfficerId: string;
  officerName: string;
  sha256Hash: string;
  targetOffice: string;
  timestamp: string;
  acknowledgmentReceiptNumber: string;
}

export type DocumentType =
  | 'Safety Certificate'
  | 'Mining Lease'
  | 'Environmental Approval'
  | 'Inspection Report'
  | 'Statutory Return'
  | 'Contractor Document'
  | 'Safety Document'
  | 'Other Regulatory Document';

export type DocumentExpiryStatus = 'Valid' | 'Expiring Soon' | 'Expired';
export type DocumentVerificationStatus = 'Verified' | 'Pending Verification' | 'Under Review' | 'Rejected';
export type DocumentProcessingStage =
  | 'Uploaded'
  | 'OCR Processing'
  | 'Text Extracted'
  | 'AI Field Detection'
  | 'Classification'
  | 'Verification Required'
  | 'Complete';

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number; // 0-1, demo/mock confidence indicator
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'jpg' | 'png';
  mineId: string;
  mineName: string;
  subsidiary: string;
  documentType: DocumentType;
  referenceNumber: string;
  issueDate: string;
  expiryDate: string | null;
  issuingAuthority: string;
  statutoryRequirement: string;
  expiryStatus: DocumentExpiryStatus;
  verification: DocumentVerificationStatus;
  processingStage: DocumentProcessingStage;
  uploadedBy: string;
  uploadDate: string;
  verifiedBy?: string;
  verificationDate?: string;
  extractedFields: ExtractedField[];
  ocrText: string;
  classificationConfidence: number;
}

export interface UserProfile {
  name: string;
  designation: string;
  role: string;
  loginId: string;
  mineId: string;
}

export interface HemmFleetStatus {
  id: string;
  equipmentType: 'CAT Shovel' | 'BEML Shovel' | 'CAT Dumper 240T' | 'BEML Dumper 100T' | 'Rotary Blast Drill' | 'Dozer / Grader';
  tag: string;
  status: 'Operational' | 'Breakdown' | 'Scheduled Maintenance' | 'Idle / Standby';
  operatorName: string;
  shiftRunningHours: number;
  fuelLevelPercent: number;
  maintenanceDueHours: number;
}

export interface CoalDispatchRecord {
  id: string;
  mode: 'Rail Rake' | 'Road Transport' | 'Merry-Go-Round (MGR)';
  destination: string;
  targetRakesOrTrucks: number;
  actualDispatched: number;
  tonnageDispatched: number;
  status: 'Loading' | 'Dispatched' | 'Weighbridge Verified' | 'Delayed';
  weighbridgeReceipt: string;
}

export interface ProductionRecord {
  id: string;
  mineId: string;
  mineName: string;
  subsidiary: string;
  date: string;
  shift: ShiftType;
  targetCoalTonnage: number;
  actualCoalTonnage: number;
  overburdenTargetBCM: number;
  overburdenActualBCM: number;
  strippingRatio: number;
  targetStrippingRatio: number;
  complianceAnomalies?: string[];
  shiftSupervisor: string;
  hemmFleet: HemmFleetStatus[];
  dispatch: CoalDispatchRecord[];
  safetyClearanceActive: boolean;
  /** Step 2: human-in-the-loop review of this record's flagged anomalies —
   * mirrors humanReviewed/reviewedBy on MineAiAnalysis (aiClient.ts). Never
   * set by AI; only an officer marking it reviewed flips this. */
  humanReviewed?: boolean;
  reviewedBy?: string;
}

