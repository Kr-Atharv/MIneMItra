import { ProductionRecord } from '../types';

export const MOCK_PRODUCTION_RECORDS: ProductionRecord[] = [
  {
    id: 'PRD-SECL-CHHAL-2026-0912-A',
    mineId: 'M-SECL-CHHAL',
    mineName: 'Chhal Opencast Mine',
    subsidiary: 'SECL',
    date: '12 Sep 2026',
    shift: 'A',
    targetCoalTonnage: 45000,
    actualCoalTonnage: 42350,
    overburdenTargetBCM: 118000,
    overburdenActualBCM: 114200,
    strippingRatio: 2.70,
    targetStrippingRatio: 2.62,
    shiftSupervisor: 'Er. R. K. Mahapatra (Shift Mgr)',
    safetyClearanceActive: true,
    complianceAnomalies: [
      'Dumper D-240-04 haulage telemetry logged 28 km/h on Ramp 3 (statutory limit: 25 km/h CMR Reg 106)',
      'Water sprinkling cycle on Coal Stockyard 2 delayed by 35 minutes'
    ],
    hemmFleet: [
      {
        id: 'HEMM-SHV-01',
        equipmentType: 'CAT Shovel',
        tag: 'CAT 7495-HD Electric Shovel',
        status: 'Operational',
        operatorName: 'Suresh Kumar Bisen (Badge #5512)',
        shiftRunningHours: 6.8,
        fuelLevelPercent: 94,
        maintenanceDueHours: 142
      },
      {
        id: 'HEMM-SHV-02',
        equipmentType: 'BEML Shovel',
        tag: 'BEML H185 Hydraulic Excavator',
        status: 'Operational',
        operatorName: 'Anil Yadav (Badge #4891)',
        shiftRunningHours: 7.1,
        fuelLevelPercent: 88,
        maintenanceDueHours: 48
      },
      {
        id: 'HEMM-DMP-01',
        equipmentType: 'CAT Dumper 240T',
        tag: 'CAT 793F Ultra Dumper #01',
        status: 'Operational',
        operatorName: 'D. N. Bhagat (Badge #6102)',
        shiftRunningHours: 7.2,
        fuelLevelPercent: 72,
        maintenanceDueHours: 210
      },
      {
        id: 'HEMM-DMP-02',
        equipmentType: 'CAT Dumper 240T',
        tag: 'CAT 793F Ultra Dumper #04',
        status: 'Scheduled Maintenance',
        operatorName: 'Unassigned (In Workshop)',
        shiftRunningHours: 1.5,
        fuelLevelPercent: 65,
        maintenanceDueHours: 0
      },
      {
        id: 'HEMM-DMP-03',
        equipmentType: 'BEML Dumper 100T',
        tag: 'BEML BH100 Mining Dumper #12',
        status: 'Operational',
        operatorName: 'J. P. Ekka (Badge #7033)',
        shiftRunningHours: 6.5,
        fuelLevelPercent: 81,
        maintenanceDueHours: 320
      },
      {
        id: 'HEMM-DRL-01',
        equipmentType: 'Rotary Blast Drill',
        tag: 'Sandvik D75KS Heavy Blast Drill',
        status: 'Operational',
        operatorName: 'P. Tirkey (Badge #3911)',
        shiftRunningHours: 5.4,
        fuelLevelPercent: 78,
        maintenanceDueHours: 96
      },
      {
        id: 'HEMM-DZR-01',
        equipmentType: 'Dozer / Grader',
        tag: 'BEML BD355 Crawler Dozer',
        status: 'Breakdown',
        operatorName: 'Standby Mechanical Crew',
        shiftRunningHours: 2.1,
        fuelLevelPercent: 54,
        maintenanceDueHours: 0
      }
    ],
    dispatch: [
      {
        id: 'DSP-RL-01',
        mode: 'Rail Rake',
        destination: 'NTPC Sipat Super Thermal (STPS)',
        targetRakesOrTrucks: 8,
        actualDispatched: 7,
        tonnageDispatched: 27800,
        status: 'Dispatched',
        weighbridgeReceipt: 'WB-RL-SECL-2026-991204 (Govt. FOIS Authenticated)'
      },
      {
        id: 'DSP-RD-01',
        mode: 'Road Transport',
        destination: 'Jindal Steel & Power Coal Washery (Tamnar)',
        targetRakesOrTrucks: 180,
        actualDispatched: 168,
        tonnageDispatched: 6720,
        status: 'Weighbridge Verified',
        weighbridgeReceipt: 'WB-RD-SECL-2026-440192 (Fastag & E-Way Bill Active)'
      },
      {
        id: 'DSP-MGR-01',
        mode: 'Merry-Go-Round (MGR)',
        destination: 'Korba Super Thermal Power Plant',
        targetRakesOrTrucks: 12,
        actualDispatched: 11,
        tonnageDispatched: 7830,
        status: 'Dispatched',
        weighbridgeReceipt: 'WB-MGR-SECL-2026-781902 (Continuous Conveyor Meter)'
      }
    ]
  },
  {
    id: 'PRD-SECL-GEVRA-2026-0912-A',
    mineId: 'M-SECL-GEVRA',
    mineName: 'Gevra Mega Opencast Project',
    subsidiary: 'SECL',
    date: '12 Sep 2026',
    shift: 'A',
    targetCoalTonnage: 140000,
    actualCoalTonnage: 138600,
    overburdenTargetBCM: 320000,
    overburdenActualBCM: 318500,
    strippingRatio: 2.30,
    targetStrippingRatio: 2.28,
    shiftSupervisor: 'Er. Sandeep Bhowmick (General Shift In-Charge)',
    safetyClearanceActive: true,
    complianceAnomalies: [],
    hemmFleet: [
      {
        id: 'HEMM-GV-SHV-01',
        equipmentType: 'CAT Shovel',
        tag: 'P&H 4100XPC 57m³ Super Shovel',
        status: 'Operational',
        operatorName: 'M. S. Negi (Badge #8102)',
        shiftRunningHours: 7.6,
        fuelLevelPercent: 96,
        maintenanceDueHours: 410
      },
      {
        id: 'HEMM-GV-DMP-01',
        equipmentType: 'CAT Dumper 240T',
        tag: 'Komatsu 930E Ultra Class Dumper #08',
        status: 'Operational',
        operatorName: 'L. N. Pradhan (Badge #7441)',
        shiftRunningHours: 7.4,
        fuelLevelPercent: 82,
        maintenanceDueHours: 190
      }
    ],
    dispatch: [
      {
        id: 'DSP-GV-RL-01',
        mode: 'Rail Rake',
        destination: 'MahaGenco Chandrapur Thermal',
        targetRakesOrTrucks: 22,
        actualDispatched: 22,
        tonnageDispatched: 88000,
        status: 'Weighbridge Verified',
        weighbridgeReceipt: 'WB-RL-GEV-2026-118832'
      }
    ]
  }
];
