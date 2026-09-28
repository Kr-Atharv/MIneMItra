import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Upload,
  AlertTriangle,
  Camera,
  MapPin,
  FileText,
  Clock,
  Fingerprint,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { ComplaintItem, MediaAttachment } from '../types';
import { useGovernance } from '../context/GovernanceContext';
import { MINE_LOCATIONS } from '../data/mockData';

interface NewComplaintModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialMineId?: string;
}

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({ isOpen = true, onClose, initialMineId }) => {
  const { activeRoleProfile, submitComplaint, createSignedMediaAttachment } = useGovernance();

  const [title, setTitle] = useState<string>('Overburden Bench Slope Instability & Tension Cracks');
  const [description, setDescription] = useState<string>(
    'During morning shift inspection, significant longitudinal tension cracks were observed along the crest of Overburden Bench 3. Berm width is degraded due to rain wash, creating high hazard for heavy dumpers.'
  );
  const [mineId, setMineId] = useState<string>(initialMineId || activeRoleProfile.mineId);
  const [seamBlock, setSeamBlock] = useState<string>('Overburden Bench 3 East (OB-3 East)');
  const [equipmentId, setEquipmentId] = useState<string>('Dumper D-240 #08');
  const [category, setCategory] = useState<ComplaintItem['category']>('Bench Stability & Slope');
  const [regulationCode, setRegulationCode] = useState<string>('CMR 2017 Reg 106(2)');
  const [severity, setSeverity] = useState<ComplaintItem['severity']>('Critical');
  const [gpsLat, setGpsLat] = useState<string>('');
  const [gpsLng, setGpsLng] = useState<string>('');
  const [locationUnavailable, setLocationUnavailable] = useState(false);

  // Media attachments
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const selectedMine = MINE_LOCATIONS.find(m => m.id === mineId) || MINE_LOCATIONS[0];

  useEffect(() => {
    const mine = MINE_LOCATIONS.find(m => m.id === mineId) || MINE_LOCATIONS[0];
    if (mine && !locationUnavailable) {
      setGpsLat(String(mine.coordinates.lat));
      setGpsLng(String(mine.coordinates.lng));
    }
  }, [mineId, locationUnavailable]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newMedia = await createSignedMediaAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: URL.createObjectURL(file),
        fileObject: file
      });
      setAttachments(prev => [...prev, newMedia]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const lat = Number(gpsLat);
    const lng = Number(gpsLng);
    submitComplaint({
      title,
      description,
      mineId: selectedMine.id,
      mineName: selectedMine.name,
      subsidiary: selectedMine.subsidiary,
      seamBlock,
      category,
      regulationCode,
      severity,
      equipmentId: equipmentId || undefined,
      media: attachments,
      locationUnavailable,
      gpsLocation: locationUnavailable ? undefined : { lat, lng, accuracy: '+/- 2.0m RTK' }
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 700);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hazard-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* Header Ribbon */}
        <div className="bg-[#00382E] text-white p-4 flex items-center justify-between border-b border-[#002820]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-emerald-950 flex items-center justify-center border border-emerald-700/60">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-emerald-300 uppercase font-bold">
                Mines Act 1952 • CMR 2017 Hazard Register
              </div>
              <h3 id="hazard-modal-title" className="text-base font-bold text-white">Log Colliery Safety Complaint / Hazard</h3>
            </div>
          </div>
          <button
            type="button"
            id="close-hazard-modal-btn"
            aria-label="Close dialog"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer shrink-0 z-20"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Notice of Workflow Progression */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-[11px] text-emerald-900 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Automatic Role Progression:</strong> Submitting will immediately route this hazard to the{' '}
            <strong>Field Inspector's Queue</strong> for physical on-site verification.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Hazard / Incident Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#004D40] bg-white font-medium text-slate-900"
              required
            />
          </div>

          {/* Colliery & Seam Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Mine Unit (Subsidiary) *
              </label>
              <select
                value={mineId}
                onChange={(e) => setMineId(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none bg-white font-semibold text-slate-800"
              >
                {MINE_LOCATIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.subsidiary} - {m.area})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Seam / Bench / Pit Location *
              </label>
              <input
                type="text"
                value={seamBlock}
                onChange={(e) => setSeamBlock(e.target.value)}
                placeholder="e.g. OB Bench 3 East, Ramp B"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
          </div>

          {/* Category, Regulation & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Statutory Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Bench Stability & Slope">Bench Stability &amp; Slope</option>
                <option value="Ventilation & Gas">Ventilation &amp; Gas</option>
                <option value="Haul Road & Transport">Haul Road &amp; Transport</option>
                <option value="HEMM Mechanical/Electrical">HEMM Mechanical/Electrical</option>
                <option value="Explosives & Blasting">Explosives &amp; Blasting</option>
                <option value="Form B / Labour Welfare">Form B / Labour Welfare</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Regulation Violated
              </label>
              <input
                type="text"
                value={regulationCode}
                onChange={(e) => setRegulationCode(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-bold text-red-700"
              >
                <option value="Critical">Critical (Stop-Work Risk)</option>
                <option value="High">High (Urgent Rectification)</option>
                <option value="Medium">Medium (Scheduled Audit)</option>
                <option value="Low">Low (Routine Observation)</option>
              </select>
            </div>
          </div>

          {/* Equipment ID */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Associated HEMM Equipment / Machinery ID (Optional)
            </label>
            <input
              type="text"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              placeholder="e.g. Dumper D-240-08, Shovel EX-44, Aux Fan S-08"
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Latitude (WGS84)</label>
              <input
                type="number"
                step="0.000001"
                value={gpsLat}
                disabled={locationUnavailable}
                onChange={(e) => setGpsLat(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Longitude (WGS84)</label>
              <input
                type="number"
                step="0.000001"
                value={gpsLng}
                disabled={locationUnavailable}
                onChange={(e) => setGpsLng(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-600">
            <input type="checkbox" checked={locationUnavailable} onChange={(e) => setLocationUnavailable(e.target.checked)} />
            Location unavailable (do not place a map pin)
          </label>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Field Observation Details &amp; Immediate Risk *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#004D40] bg-white leading-relaxed"
              required
            />
          </div>

          {/* Media Upload with Digital Signature */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-slate-800 block text-xs">
                  Attach Evidence Media (Photo, Video, PDF, Inspection Log)
                </span>
                <span className="text-[10px] text-slate-500">
                  Each file is automatically stamped with GPS coordinates, timestamp, and SHA-256 signature
                </span>
              </div>
              <label className="cursor-pointer bg-[#004D40] hover:bg-[#00382E] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Browse Files</span>
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {attachments.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                {attachments.map((att) => (
                  <div key={att.id} className="bg-white border border-slate-200 rounded p-2 flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2 truncate">
                      <Camera className="w-3.5 h-3.5 text-[#004D40] shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{att.fileName}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{(att.sizeBytes / 1000000).toFixed(1)} MB</span>
                    </div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded">
                      DIGITALLY SIGNED
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic text-center py-2">
                No attachments added yet. You can attach photos of cracks, berm washouts, or equipment logs.
              </div>
            )}
          </div>

          {/* Submitting Officer Footer Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-center justify-between">
            <div>
              <span>Filing Officer: </span>
              <strong className="text-slate-900">{activeRoleProfile.name}</strong> ({activeRoleProfile.designation})
            </div>
            <div className="font-mono text-[10px] text-[#004D40]">
              ID: {activeRoleProfile.loginId}
            </div>
          </div>

          {isSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Complaint registered! Automatically transferred to Field Inspector queue.</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registering...' : 'File Hazard & Dispatch to Inspector'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
