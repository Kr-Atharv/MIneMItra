import React, { useState } from 'react';
import {
  Activity,
  Truck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Train,
  ShieldCheck,
  Fuel,
  Wrench,
  BarChart3,
  Calendar,
  Filter
} from 'lucide-react';
import { PageId, ProductionRecord, ShiftType } from '../types';
import { MOCK_PRODUCTION_RECORDS } from '../data/mockProductionData';
import { useGovernance } from '../context/GovernanceContext';
import { SiteConditionsWidget } from '../components/SiteConditionsWidget';

interface ProductionOperationsProps {
  onNavigate?: (page: PageId) => void;
}

export const ProductionOperations: React.FC<ProductionOperationsProps> = ({ onNavigate }) => {
  const { currentRole, activeRoleProfile } = useGovernance();
  const [selectedMineId, setSelectedMineId] = useState<string>(
    activeRoleProfile.mineId === 'ALL_MINES' || activeRoleProfile.mineId === 'CIL-HQ-KOLKATA'
      ? 'M-SECL-CHHAL'
      : activeRoleProfile.mineId
  );
  const [selectedShift, setSelectedShift] = useState<ShiftType>('A');

  const record: ProductionRecord =
    MOCK_PRODUCTION_RECORDS.find(
      (r) => (r.mineId === selectedMineId || selectedMineId === 'ALL') && r.shift === selectedShift
    ) || MOCK_PRODUCTION_RECORDS[0];

  const coalAttainment = Math.round((record.actualCoalTonnage / record.targetCoalTonnage) * 100);
  const obAttainment = Math.round((record.overburdenActualBCM / record.overburdenTargetBCM) * 100);
  const operationalHemm = record.hemmFleet.filter((h) => h.status === 'Operational').length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0B6B4A] uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Colliery Production &amp; HEMM Telemetry</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-mono">CMR 2017 REG 106 / 184</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {record.mineName} ({record.subsidiary})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift {record.shift} Operational Logbook • Supervisor: {record.shiftSupervisor} • Date: {record.date}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg p-1 border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={selectedMineId}
              onChange={(e) => setSelectedMineId(e.target.value)}
              className="text-xs font-semibold bg-transparent border-0 focus:ring-0 text-slate-700 outline-none pr-2"
            >
              <option value="M-SECL-CHHAL">Chhal Opencast Mine (SECL)</option>
              <option value="M-SECL-GEVRA">Gevra Mega Opencast (SECL)</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs font-bold">
            {(['A', 'B', 'C'] as ShiftType[]).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedShift(s)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedShift === s
                    ? 'bg-[#0B6B4A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Shift {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 6 — Site Conditions (weather/AQI), location source always labelled */}
      <SiteConditionsWidget mineId={selectedMineId} />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coal Production */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wider">Coal Output</span>
            <span className="font-bold text-[#0B6B4A]">{coalAttainment}% target</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">
              {record.actualCoalTonnage.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / {record.targetCoalTonnage.toLocaleString()} T
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                coalAttainment >= 90 ? 'bg-emerald-600' : coalAttainment >= 75 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(coalAttainment, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
            <span>Variance: {(record.actualCoalTonnage - record.targetCoalTonnage).toLocaleString()} T</span>
            <span className="text-emerald-700 font-bold">Clean Steam Grade</span>
          </div>
        </div>

        {/* Overburden (OB) Excavation */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wider">Overburden (OB)</span>
            <span className="font-bold text-teal-700">{obAttainment}% target</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">
              {record.overburdenActualBCM.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / {record.overburdenTargetBCM.toLocaleString()} BCM
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                obAttainment >= 90 ? 'bg-teal-600' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(obAttainment, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
            <span>Bank Cubic Metres</span>
            <span className="text-teal-700 font-bold">Slope Bench Formed</span>
          </div>
        </div>

        {/* Stripping Ratio (OB : Coal) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wider">Stripping Ratio</span>
            <span className="font-bold text-indigo-700">m³/Tonne</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{record.strippingRatio}</span>
            <span className="text-xs font-semibold text-slate-500">
              (Target: {record.targetStrippingRatio})
            </span>
          </div>
          <div className="mt-3 text-[11px] font-semibold text-slate-600 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Optimal slope release ratio maintained</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Compliance threshold limit: ±15% statutory
          </div>
        </div>

        {/* HEMM Fleet Readiness */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wider">HEMM Fleet</span>
            <span className="font-bold text-[#0B6B4A]">
              {operationalHemm}/{record.hemmFleet.length} Active
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">
              {Math.round((operationalHemm / record.hemmFleet.length) * 100)}%
            </span>
            <span className="text-xs font-semibold text-slate-500">Availability</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              {record.hemmFleet.filter((h) => h.status === 'Operational').length} Ready
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
              {record.hemmFleet.filter((h) => h.status === 'Scheduled Maintenance').length} Sched.
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 font-bold border border-rose-200">
              {record.hemmFleet.filter((h) => h.status === 'Breakdown').length} BD
            </span>
          </div>
        </div>
      </div>

      {/* Operational Compliance Anomalies — Step 9: a distinct light-orange
          accent (not amber) marks the Step 1a production/ops anomaly flag
          specifically, so it's never confused with a generic warning state
          like the HEMM "Scheduled Maintenance" badges below, which stay amber. */}
      {record.complianceAnomalies && record.complianceAnomalies.length > 0 && (
        <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 text-xs">
          <div className="flex items-center space-x-2 text-orange-900 font-bold mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>Shift Compliance Anomalies &amp; Speed Telemetry Alerts</span>
            <span className="ml-auto text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-400 text-white">
              Anomaly flagged
            </span>
          </div>
          <div className="space-y-1.5 pl-6">
            {record.complianceAnomalies.map((anom, idx) => (
              <div key={idx} className="text-orange-950 flex items-start space-x-2">
                <span className="font-mono text-orange-500 font-bold">•</span>
                <span>{anom}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heavy Earth Moving Machinery (HEMM) Fleet Status */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-[#0B6B4A]" />
              <span>HEMM Equipment Fleet Status (CAT / BEML Heavy Assets)</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Live status of rope shovels, 240T ultra dumpers, blast drills &amp; graders under CMR 2017 Reg 184
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200 self-start sm:self-auto">
            {record.hemmFleet.length} Monitored Units
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Equipment / Asset</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Shift Hours</th>
                <th className="px-4 py-3">Fuel Level</th>
                <th className="px-4 py-3">Maint. Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {record.hemmFleet.map((unit) => {
                const statusColor =
                  unit.status === 'Operational'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : unit.status === 'Scheduled Maintenance'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200';

                return (
                  <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{unit.tag}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{unit.id}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{unit.equipmentType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                        {unit.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{unit.operatorName}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{unit.shiftRunningHours} hrs</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1.5 font-mono text-slate-700">
                        <Fuel className="w-3 h-3 text-slate-400" />
                        <span>{unit.fuelLevelPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {unit.maintenanceDueHours > 0 ? (
                        <span className="text-slate-600">{unit.maintenanceDueHours} hrs</span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center space-x-1">
                          <Wrench className="w-3 h-3" />
                          <span>Immediate</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coal Dispatch Section (Rail Rake vs Road Transport) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Train className="w-4 h-4 text-[#0B6B4A]" />
              <span>Coal Dispatch &amp; Evacuation Logistics</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Rail Rake (Indian Railways FOIS) vs Road Carrier Weighbridge Register
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 font-mono bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
            Total Dispatched: {record.dispatch.reduce((acc, d) => acc + d.tonnageDispatched, 0).toLocaleString()} T
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {record.dispatch.map((dsp) => {
            const isRail = dsp.mode === 'Rail Rake';
            const isMGR = dsp.mode === 'Merry-Go-Round (MGR)';

            return (
              <div
                key={dsp.id}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center space-x-1 text-xs font-bold text-slate-900">
                      {isRail ? (
                        <Train className="w-3.5 h-3.5 text-blue-700" />
                      ) : isMGR ? (
                        <Layers className="w-3.5 h-3.5 text-purple-700" />
                      ) : (
                        <Truck className="w-3.5 h-3.5 text-emerald-700" />
                      )}
                      <span>{dsp.mode}</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {dsp.status}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-800 mb-2">
                    Destination: {dsp.destination}
                  </div>

                  <div className="text-2xl font-black text-slate-900">
                    {dsp.tonnageDispatched.toLocaleString()} <span className="text-xs font-medium text-slate-500">Tonnes</span>
                  </div>

                  <div className="text-[11px] text-slate-600 mt-2">
                    Trips / Rakes: <strong>{dsp.actualDispatched}</strong> / {dsp.targetRakesOrTrucks} scheduled
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500 font-mono flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">{dsp.weighbridgeReceipt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
