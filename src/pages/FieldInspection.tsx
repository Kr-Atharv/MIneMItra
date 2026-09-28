import React, { useState, useRef, useEffect } from 'react';
import {
  WifiOff,
  Wifi,
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  AlertTriangle,
  PenTool,
  Save,
  Send,
  RefreshCw,
  Image as ImageIcon,
  UserCheck,
  Shield,
  Trash2
} from 'lucide-react';
import { MINE_LOCATIONS } from '../data/mockData';
import { ShiftType } from '../types';
import { useGovernance } from '../context/GovernanceContext';
import { MatchedRegulationBadge } from '../components/MatchedRegulationBadge';

export const FieldInspection: React.FC = () => {
  const { submitComplaint, createSignedMediaAttachment } = useGovernance();
  const [offlineCount, setOfflineCount] = useState<number>(3);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Auto-captured telemetry
  const [gpsCoords] = useState('22°21\'08.2"N, 82°35\'14.6"E');
  const [gpsAccuracy] = useState('+/- 2.1m (High Precision RTK)');
  const [activeShift, setActiveShift] = useState<ShiftType>('A');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }));
  }, []);

  // Form states
  const [selectedMine, setSelectedMine] = useState<string>('M-SECL-CHHAL');
  const [benchSeam, setBenchSeam] = useState<string>('Overburden Bench 3 (OB-3 East)');
  const [auditCategory, setAuditCategory] = useState<string>('Bench Stability');
  const [severity, setSeverity] = useState<'Routine' | 'Requires Attention' | 'Critical Violation'>('Requires Attention');
  const [observationText, setObservationText] = useState<string>(
    'Crack of 3.8m length observed along the crest line of Bench 3. Berm width reduced to 8.2m due to heavy rain wash.'
  );
  const [correctiveAction, setCorrectiveAction] = useState<string>(
    'Immediate backfilling and terracing required. Heavy dumper movement suspended on the crest till slope inspection by Geotechnical Engineer.'
  );
  const [departmentAssignee, setDepartmentAssignee] = useState<string>('Civil & Overburden Excavation Dept');
  const [inspectingOfficer, setInspectingOfficer] = useState<string>('Er. S. K. Verma (Assistant Manager Safety)');
  const [collieryForeman, setCollieryForeman] = useState<string>('Shri Ramdas Manjhi (Overman / Foreman #4402)');

  // Photo simulation
  const [capturedPhoto, setCapturedPhoto] = useState<boolean>(true);

  // Signature canvas refs
  const inspectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const foremanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isInspectorSigned, setIsInspectorSigned] = useState<boolean>(false);
  const [isForemanSigned, setIsForemanSigned] = useState<boolean>(false);

  // Simple drawing handlers for canvas
  const setupCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#004D40';
  };

  useEffect(() => {
    setupCanvas(inspectorCanvasRef.current);
    setupCanvas(foremanCanvasRef.current);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvasRef: React.RefObject<HTMLCanvasElement | null>, setSigned: (s: boolean) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    const onMove = (me: MouseEvent | TouchEvent) => {
      const moveX = 'touches' in me ? me.touches[0].clientX : me.clientX;
      const moveY = 'touches' in me ? me.touches[0].clientY : me.clientY;
      ctx.lineTo(moveX - rect.left, moveY - rect.top);
      ctx.stroke();
      setSigned(true);
    };

    const onEnd = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  const clearCanvas = (canvasRef: React.RefObject<HTMLCanvasElement | null>, setSigned: (s: boolean) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  };

  // Sync mechanism
  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setOfflineCount(0);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  // Submit form
  const handleSubmit = async () => {
    const mine = MINE_LOCATIONS.find(m => m.id === selectedMine) || MINE_LOCATIONS[0];
    const evidenceMedia = await createSignedMediaAttachment({
      name: 'field-survey-photo-ob3.jpg',
      type: 'image/jpeg',
      size: 2400000,
      dataUrl: ''
    });
    submitComplaint({
      title: `${auditCategory}: ${benchSeam}`,
      description: observationText,
      mineId: mine.id,
      mineName: mine.name,
      subsidiary: mine.subsidiary,
      seamBlock: benchSeam,
      category: auditCategory as any,
      regulationCode: 'CMR 2017 Reg 106',
      severity: severity === 'Critical Violation' ? 'Critical' : severity === 'Requires Attention' ? 'High' : 'Medium',
      media: [evidenceMedia]
    });
    setSubmitFeedback('Inspection record verified & dispatched to Central DGMS Ledger with SHA-256 digital stamp! Automatically queued for next role.');
    setTimeout(() => setSubmitFeedback(null), 5000);
  };

  const handleSaveOffline = () => {
    setOfflineCount((prev) => prev + 1);
    setSubmitFeedback('Inspection draft saved to rugged device encrypted local cache.');
    setTimeout(() => setSubmitFeedback(null), 4000);
  };

  const categories = [
    'Bench Stability',
    'Haul Road Safety',
    'Dust Suppression',
    'Electrical Installations',
    'PPE & Ergonomics'
  ];

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen py-4 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* 1. Top Status Header */}
        {/* Offline sync banner */}
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-amber-600 text-white flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <strong className="text-amber-950 font-bold">
                  Pit Rugged Mode: {offlineCount} Records Cached Offline
                </strong>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono font-bold">
                  Local Cache Active
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                Data saved in encrypted local IndexedDB storage. Automatic sync resumes on surface Wi-Fi connection.
              </p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing || offlineCount === 0}
            className="px-3 py-1.5 bg-[#004D40] hover:bg-[#00382E] disabled:bg-slate-300 text-white rounded font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync with DGMS Cloud'}</span>
          </button>
        </div>

        {syncSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-lg text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Successfully synced 3 inspection records to the National DGMS Statutory Ledger.</span>
          </div>
        )}

        {submitFeedback && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-lg text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{submitFeedback}</span>
          </div>
        )}

        {/* Auto-captured telemetry ribbon */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <span className="text-xs font-bold text-[#004D40] uppercase tracking-wider flex items-center space-x-1.5">
              <Shield className="w-4 h-4" />
              <span>Rugged Pit Telemetry Ribbon</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              RTK GNSS L1/L5 LOCKED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <div className="flex items-center space-x-1 text-slate-500 text-[10px] uppercase font-semibold">
                <MapPin className="w-3 h-3 text-[#004D40]" />
                <span>Live GPS Coordinates</span>
              </div>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{gpsCoords}</p>
              <span className="text-[10px] text-emerald-700 font-semibold">{gpsAccuracy}</span>
            </div>

            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <div className="flex items-center space-x-1 text-slate-500 text-[10px] uppercase font-semibold">
                <Clock className="w-3 h-3 text-[#004D40]" />
                <span>Survey Timestamp</span>
              </div>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{currentTime || '05 Sep 2026, 11:30 AM'}</p>
              <span className="text-[10px] text-slate-500">Atomic Time Synced</span>
            </div>

            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <div className="flex items-center space-x-1 text-slate-500 text-[10px] uppercase font-semibold">
                <UserCheck className="w-3 h-3 text-[#004D40]" />
                <span>Active Shift</span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {(['A', 'B', 'C'] as ShiftType[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveShift(s)}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors ${
                      activeShift === s
                        ? 'bg-[#004D40] text-white'
                        : 'bg-white text-slate-700 border border-slate-300'
                    }`}
                  >
                    Shift {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Step-by-Step Inspection Form (Large, touch-friendly UI) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-base font-bold text-slate-900">
              Field Audit &amp; Safety Hazard Observation Form
            </h3>
            <p className="text-xs text-slate-500">
              Prescribed format under CMR 2017 Regulation 106 (Bench Inspection) &amp; Reg 112 (Haulway Safety)
            </p>
          </div>

          {/* Step 1: Mine Selection & Bench/Seam Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
              <span className="w-5 h-5 rounded-full bg-[#004D40] text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Select Mine &amp; Bench / Seam Location</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1">Mine Site:</span>
                <select
                  value={selectedMine}
                  onChange={(e) => setSelectedMine(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded p-2 bg-white focus:border-[#004D40] outline-none"
                >
                  {MINE_LOCATIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.subsidiary} - {m.area} Area)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1">Specific Bench / Seam / Block:</span>
                <select
                  value={benchSeam}
                  onChange={(e) => setBenchSeam(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded p-2 bg-white focus:border-[#004D40] outline-none"
                >
                  <option value="Overburden Bench 3 (OB-3 East)">Overburden Bench 3 (OB-3 East)</option>
                  <option value="Main Incline Haulway Ramp A (Gradient 1:16)">Main Incline Haulway Ramp A (Gradient 1:16)</option>
                  <option value="Top Coal Seam Bench II (Sector North)">Top Coal Seam Bench II (Sector North)</option>
                  <option value="Bottom Sump Dewatering Basin (RL +120m)">Bottom Sump Dewatering Basin (RL +120m)</option>
                  <option value="Blasting Shelter & Explosive Transfer Point">Blasting Shelter &amp; Explosive Transfer Point</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Audit Category (Segmented buttons) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
              <span className="w-5 h-5 rounded-full bg-[#004D40] text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Audit Category</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categories.map((cat) => {
                const isActive = auditCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAuditCategory(cat)}
                    className={`py-2 px-2 text-xs font-bold rounded border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#004D40] text-white border-[#004D40] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Observation Log & Severity Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
              <span className="w-5 h-5 rounded-full bg-[#004D40] text-white flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Observation Log &amp; Severity Classification</span>
            </label>

            {/* Segmented Severity buttons */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {(['Routine', 'Requires Attention', 'Critical Violation'] as const).map((sev) => {
                const isSelected = severity === sev;
                const colors = {
                  'Routine': isSelected ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-emerald-800 border-emerald-200',
                  'Requires Attention': isSelected ? 'bg-[#D97706] text-white border-[#D97706]' : 'bg-amber-50 text-amber-900 border-amber-300',
                  'Critical Violation': isSelected ? 'bg-[#DC2626] text-white border-[#DC2626]' : 'bg-red-50 text-red-900 border-red-300'
                };

                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 text-xs font-bold rounded border transition-all cursor-pointer ${colors[sev]}`}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={3}
              value={observationText}
              onChange={(e) => setObservationText(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 rounded bg-white focus:border-[#004D40] outline-none"
              placeholder="Detail specific physical hazard, measurements, tension cracks, berm height, or electrical defects..."
            />
          </div>

          {/* Step 4: Photo & Document Attachment Box (simulating camera capture with embedded watermarked GPS/timestamp badge) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
              <span className="w-5 h-5 rounded-full bg-[#004D40] text-white flex items-center justify-center text-[10px]">
                4
              </span>
              <span>Watermarked Photographic Evidence Capture</span>
            </label>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50/50">
              {capturedPhoto ? (
                <div className="relative rounded overflow-hidden border border-slate-300 bg-slate-200 max-w-sm mx-auto">
                  {/* Simulated mine bench photo */}
                  <div className="h-44 bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700 relative flex items-center justify-center">
                    {/* Simulated rock slope */}
                    <div className="text-white/40 text-center text-xs font-mono">
                      [Pit Crest Slope Evidence Image - Geo-tagged]
                    </div>

                    {/* Official GPS & Timestamp Watermark Banner (Stamped onto thumbnail) */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/75 text-white p-2 text-[10px] font-mono leading-tight">
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span>LAT 22°21'08.2"N • LNG 82°35'14.6"E</span>
                        <span>ALT: +182m</span>
                      </div>
                      <div className="text-slate-200 mt-0.5">
                        {currentTime || '05-SEP-2026 11:30:15 IST'} | SHIFT {activeShift}
                      </div>
                      <div className="text-emerald-400 font-bold">
                        DGMS WATERMARK AUTHENTICATED
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCapturedPhoto(false)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Attach Pit Observation Photo</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Camera will auto-embed RTK coordinates, azimuth heading, and timestamp.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCapturedPhoto(true)}
                    className="mt-3 px-4 py-1.5 bg-[#004D40] text-white text-xs font-semibold rounded hover:bg-[#00382E]"
                  >
                    Simulate Camera Capture
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 5: Prescribed Corrective Action & Department Assignee */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
              <span className="w-5 h-5 rounded-full bg-[#004D40] text-white flex items-center justify-center text-[10px]">
                5
              </span>
              <span>Prescribed Corrective Action &amp; Department Assignee</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1">Assignee Department:</span>
                <select
                  value={departmentAssignee}
                  onChange={(e) => setDepartmentAssignee(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded p-2 bg-white focus:border-[#004D40] outline-none"
                >
                  <option value="Civil & Overburden Excavation Dept">Civil &amp; Overburden Excavation Dept</option>
                  <option value="Haul Road & Transport Maintenance">Haul Road &amp; Transport Maintenance</option>
                  <option value="Electrical & Pumping Department">Electrical &amp; Pumping Department</option>
                  <option value="Blasting & Explosive Wing">Blasting &amp; Explosive Wing</option>
                  <option value="Safety & Vocational Training Cell">Safety &amp; Vocational Training Cell</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1">Mandatory Rectification SLA:</span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-red-700 flex items-center justify-between">
                  <span>Within 24 Hours (Before Next Shift)</span>
                  <span className="text-[10px] bg-red-100 px-1.5 py-0.2 rounded text-red-800">Priority 1</span>
                </div>
              </div>
            </div>

            <textarea
              rows={2}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 rounded bg-white focus:border-[#004D40] outline-none mt-2"
              placeholder="Immediate directives to Colliery Manager and Shift Overman..."
            />

            {/* Step 7: as the officer closes this out with a corrective
                action, show which statutory clause it lines up with —
                pulled from ruleBookService.js (Step 5c), falling back to
                the local statute snapshot automatically if unreachable. */}
            <MatchedRegulationBadge
              query={`${auditCategory} ${correctiveAction}`}
              className="mt-2"
            />
          </div>

          {/* 3. Digital Signature Box (Dual Signature Canvas) */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <PenTool className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Digital Sign-Off Canvas (Inspecting Officer &amp; Colliery Overman)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Canvas 1: Inspecting Officer */}
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-bold text-slate-800">1. Inspecting Officer Sign-off</span>
                  <button
                    type="button"
                    onClick={() => clearCanvas(inspectorCanvasRef, setIsInspectorSigned)}
                    className="text-[10px] text-red-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded overflow-hidden">
                  <canvas
                    ref={inspectorCanvasRef}
                    width={320}
                    height={100}
                    onMouseDown={(e) => startDrawing(e, inspectorCanvasRef, setIsInspectorSigned)}
                    onTouchStart={(e) => startDrawing(e, inspectorCanvasRef, setIsInspectorSigned)}
                    className="w-full h-24 cursor-crosshair touch-none"
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-600 font-medium">
                  {inspectingOfficer}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isInspectorSigned ? '✓ Digital signature captured' : 'Draw signature with finger or mouse'}
                </div>
              </div>

              {/* Canvas 2: Colliery Overman / Foreman */}
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-bold text-slate-800">2. Colliery Overman Acknowledgement</span>
                  <button
                    type="button"
                    onClick={() => clearCanvas(foremanCanvasRef, setIsForemanSigned)}
                    className="text-[10px] text-red-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded overflow-hidden">
                  <canvas
                    ref={foremanCanvasRef}
                    width={320}
                    height={100}
                    onMouseDown={(e) => startDrawing(e, foremanCanvasRef, setIsForemanSigned)}
                    onTouchStart={(e) => startDrawing(e, foremanCanvasRef, setIsForemanSigned)}
                    className="w-full h-24 cursor-crosshair touch-none"
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-600 font-medium">
                  {collieryForeman}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isForemanSigned ? '✓ Digital signature captured' : 'Draw signature with finger or mouse'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Action Bar (Sticky footer buttons) */}
        <div className="sticky bottom-3 z-30 bg-white border border-slate-300 rounded-lg p-3 shadow-lg flex items-center justify-between gap-3">
          <div className="text-xs text-slate-600 hidden sm:block">
            Status: <strong className="text-[#004D40]">Ready for DGMS Gateway Dispatch</strong>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleSaveOffline}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded flex items-center justify-center space-x-1.5 border border-slate-300 cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>Save Draft Offline</span>
            </button>

            <button
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-5 py-2 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold rounded uppercase tracking-wider flex items-center justify-center space-x-1.5 border border-[#004D40] shadow cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Verify &amp; Submit to DGMS Ledger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
