import { AppRole, ComplaintItem, ComplaintStatus } from '../types';
import { MINE_LOCATIONS } from './mockData';
import { offsetWithinMine } from '../lib/geo';

type Category = ComplaintItem['category'];
type Severity = ComplaintItem['severity'];

const CATEGORIES: Category[] = [
  'Bench Stability & Slope',
  'Ventilation & Gas',
  'Haul Road & Transport',
  'HEMM Mechanical/Electrical',
  'Explosives & Blasting',
  'Form B / Labour Welfare',
  'Environmental Compliance'
];

const REGS: Record<Category, string> = {
  'Bench Stability & Slope': 'CMR 2017 Reg 106(2)',
  'Ventilation & Gas': 'CMR 2017 Reg 104',
  'Haul Road & Transport': 'CMR 2017 Reg 112(4)',
  'HEMM Mechanical/Electrical': 'CMR 2017 Reg 184',
  'Explosives & Blasting': 'CMR 2017 Reg 164',
  'Form B / Labour Welfare': 'Mines Rules 1955 — Form B',
  'Environmental Compliance': 'MoEFCC / CPCB EC Condition 4(B)'
};

const TITLES: Record<Category, string[]> = {
  'Bench Stability & Slope': [
    'Overburden bench crest tension crack',
    'Berm undercut after monsoon wash',
    'Catch-bench width below 1:1.5 ratio',
    'Toe saturation on highwall face'
  ],
  'Ventilation & Gas': [
    'CH4 sensor drift above 0.75% threshold',
    'Auxiliary fan vibration trip',
    'Return airway velocity below 30 m/min',
    'Goaf seal leakage indicated on telemetry'
  ],
  'Haul Road & Transport': [
    'Parapet berm collapse on haul curve',
    'Water ruts exceeding 150 mm depth',
    'Ramp gradient locally steeper than 1:16',
    'Sight-distance obstruction at dump lip'
  ],
  'HEMM Mechanical/Electrical': [
    'Dumper secondary brake accumulator drop',
    'Shovel slew-brake overheating',
    'Dozer fire-suppression bottle overdue',
    'Drill mast limit-switch failure'
  ],
  'Explosives & Blasting': [
    'Magazine humidity above statutory limit',
    'Misfire hole left unattended after blast',
    'Flyrock exclusion zone breach',
    'Explosives van earthing strap defective'
  ],
  'Form B / Labour Welfare': [
    'Contract worker PME certificate expired',
    'VT refresher overdue for HEMM crew',
    'Form B muster mismatch at gate',
    'First-aid box inventory shortfall'
  ],
  'Environmental Compliance': [
    'Effluent treatment plant (ETP) pH deviation',
    'Ambient PM10 / PM2.5 monitoring exceedance',
    'Dust mist cannon pressure drop at coal washery',
    'Topsoil dump stabilization vegetative cover deficit'
  ]
};

const SO = {
  officerId: 'CIL-SO-8821',
  name: 'Er. Rajeshwar Rao',
  role: 'safety_officer' as AppRole
};
const FI = {
  officerId: 'DGMS-FI-4402',
  name: 'Er. S. K. Verma'
};
const MO = {
  officerId: 'CIL-MO-9104',
  name: 'Er. Vikramaditya Sen'
};
const AUD = {
  officerId: 'DGMS-AUD-3108',
  name: 'Dr. Arindam Mukherjee'
};

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(16, '0') + 'a'.repeat(48).slice(0, 48);
}

function ts(day: number, hour: number, minute = 10) {
  const d = String(day).padStart(2, '0');
  const ap = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${d} Sep 2026, ${String(h12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ap} IST`;
}

function lifecycle(
  status: ComplaintStatus,
  day: number
): Pick<ComplaintItem, 'inspectedBy' | 'maintenanceBy' | 'auditVerifiedBy' | 'timeline' | 'currentResponsibleRole'> {
  const timeline: ComplaintItem['timeline'] = [
    {
      id: `EVT-${day}-A`,
      timestamp: ts(Math.max(1, day - 3), 8),
      action: 'Safety Hazard Logged & Transferred to Field Inspector',
      actorName: SO.name,
      actorRole: 'safety_officer',
      newStatus: 'PENDING_INSPECTION',
      signatureHash: hash(`a${day}`)
    }
  ];

  if (status === 'SUBMITTED') {
    return { currentResponsibleRole: 'safety_officer', timeline };
  }

  if (status === 'PENDING_INSPECTION') {
    return { currentResponsibleRole: 'field_inspector', timeline };
  }

  timeline.push({
    id: `EVT-${day}-B`,
    timestamp: ts(Math.max(1, day - 2), 11),
    action: 'Field Inspection Completed',
    actorName: FI.name,
    actorRole: 'field_inspector',
    previousStatus: 'PENDING_INSPECTION',
    newStatus: status === 'PENDING_AUDIT' && day % 9 === 0 ? 'PENDING_AUDIT' : 'ASSIGNED_MAINTENANCE',
    comments: 'On-site measurements recorded. Photographic evidence attached.',
    signatureHash: hash(`b${day}`)
  });

  const inspectedBy = {
    officerId: FI.officerId,
    name: FI.name,
    timestamp: ts(Math.max(1, day - 2), 11),
    findings: 'Physical inspection completed. Statutory measurements logged against CMR schedule.',
    measurements: { 'GPS fix': 'RTK locked', 'Photo evidence': '3 stills' },
    requiresMaintenance: status !== 'PENDING_AUDIT' || day % 9 !== 0,
    signatureHash: hash(`insp${day}`)
  };

  if (status === 'ASSIGNED_MAINTENANCE') {
    return { currentResponsibleRole: 'maintenance_officer', inspectedBy, timeline };
  }

  timeline.push({
    id: `EVT-${day}-C`,
    timestamp: ts(Math.max(1, day - 1), 15),
    action: 'Maintenance & Repairs Completed -> Sent to Audit',
    actorName: MO.name,
    actorRole: 'maintenance_officer',
    previousStatus: 'ASSIGNED_MAINTENANCE',
    newStatus: 'PENDING_AUDIT',
    signatureHash: hash(`c${day}`)
  });

  const maintenanceBy = {
    officerId: MO.officerId,
    name: MO.name,
    timestamp: ts(Math.max(1, day - 1), 15),
    actionTaken: 'Rectification completed as per work order. Test run signed.',
    partsReplaced: day % 2 === 0 ? 'Hydraulic seal kit / berm fill' : 'Sensor cartridge / berm rock',
    hoursDowntime: 8 + (day % 20),
    signatureHash: hash(`mnt${day}`)
  };

  if (status === 'PENDING_AUDIT') {
    return { currentResponsibleRole: 'audit_compliance_officer', inspectedBy, maintenanceBy, timeline };
  }

  timeline.push({
    id: `EVT-${day}-D`,
    timestamp: ts(day, 16),
    action: 'DGMS Statutory Certification Affixed -> Workflow Closed',
    actorName: AUD.name,
    actorRole: 'audit_compliance_officer',
    previousStatus: 'PENDING_AUDIT',
    newStatus: 'RESOLVED_VERIFIED',
    comments: 'Certified under CMR 2017. Receipt issued.',
    signatureHash: hash(`d${day}`)
  });

  return {
    currentResponsibleRole: 'corporate_director',
    inspectedBy,
    maintenanceBy,
    auditVerifiedBy: {
      officerId: AUD.officerId,
      name: AUD.name,
      timestamp: ts(day, 16),
      remarks: 'Statutory verification completed. Residual risk within bounds.',
      dgmsReceiptNumber: `DGMS-SEED-2026-${1000 + day}`,
      signatureHash: hash(`aud${day}`)
    },
    timeline
  };
}

interface Spec {
  mineId: string;
  count: number;
  start: number;
  mix: ComplaintStatus[];
}

const SPECS: Spec[] = [
  { mineId: 'M-SECL-CHHAL', count: 26, start: 1, mix: ['SUBMITTED', 'PENDING_INSPECTION', 'PENDING_INSPECTION', 'ASSIGNED_MAINTENANCE', 'ASSIGNED_MAINTENANCE', 'PENDING_AUDIT', 'RESOLVED_VERIFIED'] },
  { mineId: 'M-SECL-GEVRA', count: 12, start: 30, mix: ['PENDING_INSPECTION', 'ASSIGNED_MAINTENANCE', 'PENDING_AUDIT', 'RESOLVED_VERIFIED'] },
  { mineId: 'M-SECL-KUSMUNDA', count: 8, start: 42, mix: ['PENDING_INSPECTION', 'ASSIGNED_MAINTENANCE', 'RESOLVED_VERIFIED'] },
  { mineId: 'M-CCL-RAJRAPPA', count: 10, start: 50, mix: ['PENDING_INSPECTION', 'ASSIGNED_MAINTENANCE', 'PENDING_AUDIT', 'RESOLVED_VERIFIED'] },
  { mineId: 'M-BCCL-MOONIDIH', count: 8, start: 60, mix: ['PENDING_INSPECTION', 'ASSIGNED_MAINTENANCE', 'RESOLVED_VERIFIED'] },
  { mineId: 'M-NCL-JAYANT', count: 6, start: 68, mix: ['ASSIGNED_MAINTENANCE', 'RESOLVED_VERIFIED', 'PENDING_AUDIT'] },
  { mineId: 'M-MCL-LAKHANPUR', count: 8, start: 74, mix: ['PENDING_INSPECTION', 'ASSIGNED_MAINTENANCE', 'PENDING_AUDIT'] }
];

const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

export const SEEDED_COMPLAINTS: ComplaintItem[] = SPECS.flatMap((spec) => {
  const mine = MINE_LOCATIONS.find((m) => m.id === spec.mineId);
  if (!mine) return [];

  return Array.from({ length: spec.count }, (_, i) => {
    const n = spec.start + i;
    const category = CATEGORIES[i % CATEGORIES.length];
    const severity = SEVERITIES[i % SEVERITIES.length];
    const status = spec.mix[i % spec.mix.length];
    const titleBase = TITLES[category][i % TITLES[category].length];
    const noGps = spec.mineId === 'M-SECL-CHHAL' && i === 25;
    const gps = noGps ? undefined : { ...offsetWithinMine(mine.coordinates, i), accuracy: '+/- 1.8m RTK' };
    const day = 1 + (i % 6);
    const life = lifecycle(status, day);
    const id = `CMP-2026-${String(n).padStart(3, '0')}`;

    const item: ComplaintItem = {
      id,
      trackingNumber: `CIL-CMP-2026-${String(4000 + n)}`,
      title: `${titleBase} — ${mine.name.split(' ')[0]} #${i + 1}`,
      description: `${titleBase} recorded at ${mine.name} (${mine.area}). Statutory follow-up under ${REGS[category]}. Seam/bench: ${mine.type} working face ${i + 1}.`,
      mineId: mine.id,
      mineName: mine.name,
      subsidiary: mine.subsidiary,
      seamBlock: `${mine.type === 'Underground' ? 'Seam District' : 'OB Bench'} ${1 + (i % 4)}`,
      equipmentId: i % 3 === 0 ? `HEMM-${mine.subsidiary}-${100 + i}` : undefined,
      category,
      regulationCode: REGS[category],
      severity,
      status,
      submittedBy: {
        officerId: SO.officerId,
        name: SO.name,
        role: 'safety_officer',
        timestamp: ts(Math.max(1, day - 3), 8, 15 + (i % 40)),
        shift: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C'
      },
      media: gps
        ? [
            {
              id: `MED-${id}`,
              fileName: `field_${id.toLowerCase()}.jpg`,
              fileType: 'image',
              url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
              sizeBytes: 1800000 + i * 1000,
              timestamp: ts(Math.max(1, day - 3), 8),
              uploadedBy: `${SO.name} (Safety Officer)`,
              role: 'safety_officer',
              sha256Hash: hash(`med${id}`),
              digitalSignature: `SIG-SO-${n}`,
              gpsLocation: { lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy }
            }
          ]
        : [],
      aiInsight: {
        riskScore: severity === 'Critical' ? 88 : severity === 'High' ? 72 : severity === 'Medium' ? 48 : 22,
        hazardPrediction: `Pattern consistent with ${category} at ${mine.name}.`,
        suggestedMitigation: 'Follow CMR staged inspection → maintenance → audit lifecycle.',
        patternAnomaly: i % 5 === 0 ? 'Recurring monsoon-related pattern at this bench.' : 'Isolated occurrence this shift.',
        provider: 'MineMitra AI',
        confidence: 0.9
      },
      gpsLocation: gps,
      locationUnavailable: noGps,
      ...life
    };

    if (status === 'SUBMITTED') {
      item.status = 'SUBMITTED';
      item.currentResponsibleRole = 'safety_officer';
      item.timeline = [
        {
          id: `EVT-${id}-S`,
          timestamp: item.submittedBy.timestamp,
          action: 'Draft hazard logged — awaiting transfer to inspection queue',
          actorName: SO.name,
          actorRole: 'safety_officer',
          newStatus: 'SUBMITTED',
          signatureHash: hash(`sub${id}`)
        }
      ];
    }

    return item;
  });
});
