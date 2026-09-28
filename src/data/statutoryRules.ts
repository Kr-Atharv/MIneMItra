import { StatutoryRuleClause } from '../types';

export const OFFICIAL_CMR_REGULATIONS: StatutoryRuleClause[] = [
  {
    regulationNumber: 'CMR 2017 Reg 106',
    title: 'Manual and Mechanized Opencast Workings & Bench Parameters',
    statute: 'CMR 2017',
    penaltyClause: 'Mines Act Section 22 Stop-Work Notice & Suspension of Manager Certificate',
    responsibleOfficerRole: 'safety_officer',
    mandatoryInspectionInterval: 'Every shift by Overman & Mining Sirdar',
    summary: 'The height of benches in overburden and coal shall not exceed the maximum reach of the excavator or loading machine. The bench width shall not be less than the height of the bench, and in no case less than 3 meters. Slope of benches shall be maintained stable under scientific rock mechanics study.'
  },
  {
    regulationNumber: 'CMR 2017 Reg 112',
    title: 'Haul Roads, Gradients and Vehicle Protection Berms',
    statute: 'CMR 2017',
    penaltyClause: 'Prohibition of heavy transport movement under Section 22(1)',
    responsibleOfficerRole: 'field_inspector',
    mandatoryInspectionInterval: 'Weekly geotechnical audit & daily shift inspection',
    summary: 'Gradient of haul roads shall not be steeper than 1 in 16. Roadway width must be at least 3 times the width of the widest vehicle. Substantial safety berms or parapet walls of height not less than the diameter of the largest tire of any dumper shall be maintained along the edge of all roads.'
  },
  {
    regulationNumber: 'CMR 2017 Reg 104',
    title: 'Underground Standards of Ventilation & Gas Monitoring',
    statute: 'CMR 2017',
    penaltyClause: 'Immediate evacuation of district and statutory prosecution under Section 72C',
    responsibleOfficerRole: 'safety_officer',
    mandatoryInspectionInterval: 'Continuous automatic telemetry + manual flame lamp every 2 hours',
    summary: 'Inflammable gas (CH4) shall not exceed 0.75% in the general body of return air from any ventilating district, and 1.25% in any part of the mine. Air velocity in working faces shall be maintained at least 30 m/min. Carbon monoxide shall not exceed 50 PPM under normal operational conditions.'
  },
  {
    regulationNumber: 'CMR 2017 Reg 184',
    title: 'Heavy Earth Moving Machinery (HEMM) Fitness & Safety Devices',
    statute: 'CMR 2017',
    penaltyClause: 'De-registration of equipment and compounding penalty on Contractor/Superintendent',
    responsibleOfficerRole: 'maintenance_officer',
    mandatoryInspectionInterval: 'Pre-shift operator inspection + 250-hour statutory workshop overhaul',
    summary: 'Every dump truck, shovel, loader, and dragline must be equipped with fail-safe dual braking systems, automatic fire detection and suppression (AFDSS), rear-view camera with display in operator cabin, proximity warning radar, and emergency steering power.'
  },
  {
    regulationNumber: 'CMR 2017 Reg 164',
    title: 'Explosives, Controlled Blasting & Danger Cordon',
    statute: 'CMR 2017',
    penaltyClause: 'Cancellation of Blaster/Overman statutory certificate and criminal liability',
    responsibleOfficerRole: 'field_inspector',
    mandatoryInspectionInterval: 'Prior to charging each round and post-firing misfire inspection',
    summary: 'Danger zone of 500 meters radius shall be cleared and cordoned off with sentries prior to blasting. Vibration monitoring (PPV) must not exceed DGMS circular thresholds for surface structures. All shots fired must be logged in the statutory explosives register Form IV.'
  },
  {
    regulationNumber: 'Mines Rules 1955 Form B',
    title: 'Register of Persons Employed & Biometric Aadhaar Verification',
    statute: 'Mines Rules 1955',
    penaltyClause: 'Closure of contractor work order and blacklisting under CIL Integrity Pact',
    responsibleOfficerRole: 'safety_officer',
    mandatoryInspectionInterval: '100% daily electronic muster entry at mine security gate',
    summary: 'No person shall be allowed to enter the mine without valid statutory Vocational Training Certificate (VTC), Initial/Periodical Medical Examination (IME/PME fitness), and biometric attendance recorded in Form B register. Contractual labour must receive wages per High Powered Committee (HPC) scales.'
  },
  {
    regulationNumber: 'Mines Act Sec 22',
    title: 'Powers of Inspector in Case of Emergent Danger & Work Suspension',
    statute: 'Mines Act 1952',
    penaltyClause: 'Immediate statutory prohibition order issued to Colliery Manager and Area GM',
    responsibleOfficerRole: 'audit_compliance_officer',
    mandatoryInspectionInterval: 'Immediate upon identification of grave danger to life or limb',
    summary: 'Where an Inspector finds any condition in a mine dangerous to human life or safety, he may by order in writing prohibit the extraction of coal or employment of persons in such mine or area until the danger is removed to his statutory satisfaction.'
  }
];
