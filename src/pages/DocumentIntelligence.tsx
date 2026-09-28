import React, { useMemo, useRef, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  UploadCloud,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ScanText,
  Sparkles,
  Tag,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Copy,
  History,
  XCircle,
  FileWarning,
  Building2
} from 'lucide-react';
import { DOCUMENT_RECORDS, MINE_LOCATIONS } from '../data/mockData';
import { DocumentRecord, DocumentProcessingStage, DocumentType, PageId } from '../types';
import { useGovernance } from '../context/GovernanceContext';
import { extractTextFromFile } from '../lib/ocrClient';
import { isRateLimited, RATE_LIMIT_MESSAGE } from '../lib/aiClient';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface DocumentIntelligenceProps {
  onNavigate: (page: PageId) => void;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'Safety Certificate',
  'Mining Lease',
  'Environmental Approval',
  'Inspection Report',
  'Statutory Return',
  'Contractor Document',
  'Safety Document',
  'Other Regulatory Document'
];

const PROCESSING_STAGES: DocumentProcessingStage[] = [
  'Uploaded',
  'OCR Processing',
  'Text Extracted',
  'AI Field Detection',
  'Classification',
  'Verification Required',
  'Complete'
];

const daysUntil = (dateStr: string | null) => {
  if (!dateStr) return Infinity;
  const today = new Date('2026-09-06');
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const expiryTone = (status: DocumentRecord['expiryStatus']) => {
  switch (status) {
    case 'Expired':
      return 'bg-red-50 text-red-700 border-red-300';
    case 'Expiring Soon':
      return 'bg-amber-50 text-amber-700 border-amber-300';
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
  }
};

const verificationTone = (status: DocumentRecord['verification']) => {
  switch (status) {
    case 'Verified':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    case 'Rejected':
      return 'bg-red-50 text-red-700 border-red-300';
    case 'Under Review':
      return 'bg-blue-50 text-blue-700 border-blue-300';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-300';
  }
};

const KpiTile: React.FC<{ label: string; value: number; tone: string; icon: React.ElementType }> = ({ label, value, tone, icon: Icon }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className={`w-6 h-6 rounded flex items-center justify-center border ${tone}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </div>
    <div className="text-xl font-extrabold text-slate-900">{value}</div>
  </div>
);

export const DocumentIntelligence: React.FC<DocumentIntelligenceProps> = ({ onNavigate }) => {
  const { currentRole, activeRoleProfile } = useGovernance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentRecord[]>(DOCUMENT_RECORDS);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadMineId, setUploadMineId] = useState(MINE_LOCATIONS[0].id);
  const [uploadStage, setUploadStage] = useState<DocumentProcessingStage | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterExpiry, setFilterExpiry] = useState<'All' | 'Expired' | 'Within 7' | 'Within 30' | 'Within 90'>('All');
  const [filterType, setFilterType] = useState<'All' | DocumentType>('All');
  const [filterVerification, setFilterVerification] = useState<'All' | DocumentRecord['verification']>('All');

  const canVerify = currentRole === 'audit_compliance_officer';

  const kpis = useMemo(
    () => ({
      total: documents.length,
      verified: documents.filter((d) => d.verification === 'Verified').length,
      pending: documents.filter((d) => d.verification === 'Pending Verification').length,
      expiringSoon: documents.filter((d) => d.expiryStatus === 'Expiring Soon').length,
      expired: documents.filter((d) => d.expiryStatus === 'Expired').length,
      underReview: documents.filter((d) => d.verification === 'Under Review').length
    }),
    [documents]
  );

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (search && !`${d.fileName} ${d.mineName} ${d.subsidiary} ${d.documentType} ${d.referenceNumber}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (filterType !== 'All' && d.documentType !== filterType) return false;
      if (filterVerification !== 'All' && d.verification !== filterVerification) return false;
      if (filterExpiry !== 'All') {
        const dleft = daysUntil(d.expiryDate);
        if (filterExpiry === 'Expired' && d.expiryStatus !== 'Expired') return false;
        if (filterExpiry === 'Within 7' && !(dleft >= 0 && dleft <= 7)) return false;
        if (filterExpiry === 'Within 30' && !(dleft >= 0 && dleft <= 30)) return false;
        if (filterExpiry === 'Within 90' && !(dleft >= 0 && dleft <= 90)) return false;
      }
      return true;
    });
  }, [documents, search, filterType, filterVerification, filterExpiry]);

  // ---- OCR pipeline (Step 6 — real OCR via server/routes/ocr.js, which
  // forwards the file to whatever OCR_API_URL is set in .env). Field
  // extraction/classification below stay deterministic placeholders —
  // only the OCR text-extraction stage calls a live backend. ----
  const runOcrPipeline = async (file: File, mineId: string) => {
    const mine = MINE_LOCATIONS.find((m) => m.id === mineId) || MINE_LOCATIONS[0];
    const fileName = file.name;
    setOcrError(null);

    setUploadStage('Uploaded');
    await sleep(350);

    setUploadStage('OCR Processing');
    const ocrResult = await extractTextFromFile(file);

    setUploadStage('Text Extracted');
    await sleep(300);
    setUploadStage('AI Field Detection');
    await sleep(500);
    setUploadStage('Classification');
    await sleep(400);
    setUploadStage('Verification Required');

    if (ocrResult.degraded) {
      // Step 10: same shared, honest inline message every rate-limited
      // widget in the app uses (AskGovernanceAI, AIAnalysisModal,
      // GovernanceOverview, SiteConditionsWidget) — a 429 here shouldn't
      // read differently just because OCR is a different provider.
      const message =
        ocrResult.errorCode === 'OCR_NOT_CONFIGURED'
          ? 'OCR_API_URL is not set on the server — add it to .env (see .env.example) and restart the server.'
          : isRateLimited(ocrResult.errorCode)
          ? RATE_LIMIT_MESSAGE
          : `OCR request failed (${ocrResult.errorCode || 'unknown error'}) — the document was still filed, but text extraction is empty.`;
      setOcrError(message);
    }

    const docType = DOCUMENT_TYPES[Math.abs(fileName.length + mine.name.length) % DOCUMENT_TYPES.length];
    const newDoc: DocumentRecord = {
      id: `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      fileName,
      fileType: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : fileName.toLowerCase().endsWith('.png') ? 'png' : 'jpg',
      mineId: mine.id,
      mineName: mine.name,
      subsidiary: mine.subsidiary,
      documentType: docType,
      referenceNumber: `${docType.slice(0, 2).toUpperCase()}/${mine.subsidiary}/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: '2026-09-06',
      expiryDate: '2027-09-06',
      issuingAuthority: 'DGMS',
      statutoryRequirement: 'Pending manual statutory mapping',
      expiryStatus: 'Valid',
      verification: 'Pending Verification',
      processingStage: 'Verification Required',
      uploadedBy: activeRoleProfile.name,
      uploadDate: '2026-09-06',
      classificationConfidence: 0.82,
      // Field extraction/classification are still deterministic
      // placeholders (not requested to change) — only ocrText below comes
      // from the live OCR call.
      extractedFields: [
        { label: 'Mine Name', value: mine.name, confidence: 0.9 },
        { label: 'Subsidiary', value: mine.subsidiary, confidence: 0.88 },
        { label: 'Document Type', value: docType, confidence: 0.82 },
        { label: 'Reference Number', value: `Auto-generated — pending review`, confidence: 0.6 },
        { label: 'Issue Date', value: '06/09/2026', confidence: 0.7 },
        { label: 'Expiry Date', value: '06/09/2027', confidence: 0.55 },
        { label: 'Issuing Authority', value: 'DGMS (unconfirmed)', confidence: 0.5 }
      ],
      ocrText:
        ocrResult.ocrText ||
        (ocrResult.degraded
          ? '[OCR unavailable — see the warning in the upload dialog. Re-upload once the OCR provider is reachable.]'
          : '')
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setTimeout(() => {
      setUploadStage('Complete');
    }, 400);
  };

  const handleFileSelected = (file: File) => {
    setUploadFileName(file.name);
    void runOcrPipeline(file, uploadMineId);
  };

  const closeUpload = () => {
    setIsUploadOpen(false);
    setUploadStage(null);
    setUploadFileName('');
    setOcrError(null);
  };

  const updateDoc = (id: string, patch: Partial<DocumentRecord>) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    setSelectedDoc((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  const updateExtractedField = (docId: string, idx: number, value: string) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        const fields = [...d.extractedFields];
        fields[idx] = { ...fields[idx], value };
        return { ...d, extractedFields: fields };
      })
    );
    setSelectedDoc((prev) => {
      if (!prev || prev.id !== docId) return prev;
      const fields = [...prev.extractedFields];
      fields[idx] = { ...fields[idx], value };
      return { ...prev, extractedFields: fields };
    });
  };

  // ---------------------------------------------------------------------
  // Document workspace (two-panel OCR result screen)
  // ---------------------------------------------------------------------
  const renderWorkspace = (doc: DocumentRecord) => (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-5xl rounded-lg shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 py-3 bg-[#004D40] text-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{doc.fileName}</div>
            <div className="text-[10px] text-emerald-200 font-mono">{doc.mineName} • {doc.subsidiary} • {doc.referenceNumber}</div>
          </div>
          <button onClick={() => setSelectedDoc(null)} className="p-1 hover:bg-white/10 rounded shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Processing workflow strip */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center space-x-1 overflow-x-auto text-[10px] shrink-0">
          {PROCESSING_STAGES.map((s, i) => {
            const currentIdx = PROCESSING_STAGES.indexOf(doc.processingStage);
            const isDone = i < currentIdx || doc.processingStage === 'Complete';
            const isCurrent = i === currentIdx && doc.processingStage !== 'Complete';
            return (
              <div key={s} className="flex items-center shrink-0">
                <span
                  className={`px-2 py-1 rounded-full font-bold border ${
                    isDone ? 'bg-emerald-600 text-white border-emerald-600' : isCurrent ? 'bg-amber-400 text-slate-900 border-amber-400' : 'bg-white text-slate-400 border-slate-300'
                  }`}
                >
                  {s}
                </span>
                {i < PROCESSING_STAGES.length - 1 && <div className="w-4 h-px bg-slate-300 mx-1" />}
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col sm:flex-row">
          {/* LEFT: document preview */}
          <div className="sm:w-1/2 bg-slate-900 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2 text-white text-[11px]">
              <span className="font-mono">Preview — Page 1 of 1</span>
              <div className="flex items-center space-x-1">
                <button className="p-1 bg-white/10 hover:bg-white/20 rounded"><ZoomOut className="w-3.5 h-3.5" /></button>
                <button className="p-1 bg-white/10 hover:bg-white/20 rounded"><ZoomIn className="w-3.5 h-3.5" /></button>
                <button className="p-1 bg-white/10 hover:bg-white/20 rounded" disabled><ChevronLeft className="w-3.5 h-3.5 opacity-40" /></button>
                <button className="p-1 bg-white/10 hover:bg-white/20 rounded" disabled><ChevronRight className="w-3.5 h-3.5 opacity-40" /></button>
              </div>
            </div>
            <div className="flex-1 bg-white rounded shadow-inner flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <FileText className="w-14 h-14 mb-3 text-slate-300" />
              <div className="text-xs font-semibold text-slate-500">{doc.fileName}</div>
              <div className="text-[10px] text-slate-400 mt-1">Document preview rendering ({doc.fileType.toUpperCase()})</div>
            </div>
          </div>

          {/* RIGHT: extracted fields + text + classification + verification */}
          <div className="sm:w-1/2 p-4 space-y-4">
            <div>
              <div className="flex items-center space-x-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">AI Field Extraction</h4>
              </div>
              <div className="space-y-2.5">
                {doc.extractedFields.map((f, idx) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{f.label}</span>
                      <span className="text-[10px] font-mono text-slate-400">Confidence: {Math.round(f.confidence * 100)}%</span>
                    </div>
                    <input
                      value={f.value}
                      onChange={(e) => updateExtractedField(doc.id, idx, e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:border-[#004D40] outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1.5 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Classification</h4>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-blue-200 bg-blue-50/60 text-xs">
                <span className="font-bold text-blue-900">{doc.documentType}</span>
                <span className="text-[10px] font-mono text-blue-700">Confidence: {Math.round(doc.classificationConfidence * 100)}% (demo)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <ScanText className="w-3.5 h-3.5 text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">OCR Extracted Text</h4>
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(doc.ocrText)}
                  className="flex items-center space-x-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[11px] text-slate-700 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                {doc.ocrText}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1.5 mb-1.5">
                <FileWarning className="w-3.5 h-3.5 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Expiry Intelligence</h4>
              </div>
              <div className={`p-2 rounded border text-xs font-bold ${expiryTone(doc.expiryStatus)}`}>
                {doc.expiryStatus}{doc.expiryDate ? ` — ${doc.expiryDate}` : ' — No expiry recorded'}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1.5 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Verification</h4>
              </div>
              <div className={`p-2 rounded border text-xs font-bold mb-2 ${verificationTone(doc.verification)}`}>
                {doc.verification}
                {doc.verifiedBy && <span className="block text-[10px] font-normal mt-0.5">By {doc.verifiedBy} on {doc.verificationDate}</span>}
              </div>
              {canVerify ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      updateDoc(doc.id, {
                        verification: 'Verified',
                        verifiedBy: activeRoleProfile.name,
                        verificationDate: '06 Sep 2026',
                        processingStage: 'Complete'
                      })
                    }
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve / Verify</span>
                  </button>
                  <button
                    onClick={() => updateDoc(doc.id, { verification: 'Rejected', verifiedBy: activeRoleProfile.name, verificationDate: '06 Sep 2026' })}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded flex items-center justify-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => updateDoc(doc.id, { verification: 'Under Review' })}
                    className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded"
                  >
                    Mark for Review
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">
                  Verification actions are restricted to the Audit &amp; Compliance Officer role under current permissions.
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-1.5 mb-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Document Audit Trail</h4>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div>Uploaded by <strong>{doc.uploadedBy}</strong> on {doc.uploadDate}</div>
                {doc.verifiedBy && <div>Verification action by <strong>{doc.verifiedBy}</strong> on {doc.verificationDate}</div>}
                <div>Current status: <strong>{doc.processingStage}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen py-4 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <ScanText className="w-5 h-5 text-[#004D40]" />
              <h1 className="text-lg font-extrabold text-slate-900">Document Intelligence</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Upload → OCR → AI Field Extraction → Classification → Verification → Compliance Monitoring</p>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold rounded"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* KPI overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiTile label="Total Documents" value={kpis.total} tone="text-[#004D40] bg-emerald-50 border-emerald-200" icon={FileText} />
          <KpiTile label="Verified" value={kpis.verified} tone="text-emerald-700 bg-emerald-50 border-emerald-200" icon={CheckCircle2} />
          <KpiTile label="Pending Verification" value={kpis.pending} tone="text-amber-700 bg-amber-50 border-amber-200" icon={Clock} />
          <KpiTile label="Expiring Soon" value={kpis.expiringSoon} tone="text-amber-700 bg-amber-50 border-amber-200" icon={AlertTriangle} />
          <KpiTile label="Expired" value={kpis.expired} tone="text-red-700 bg-red-50 border-red-200" icon={FileWarning} />
          <KpiTile label="Under Review" value={kpis.underReview} tone="text-blue-700 bg-blue-50 border-blue-200" icon={ScanText} />
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mine, subsidiary, type, reference no..."
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded outline-none focus:border-[#004D40]"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="text-xs border border-slate-300 rounded px-2 py-1.5 outline-none">
            <option value="All">All Document Types</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select value={filterVerification} onChange={(e) => setFilterVerification(e.target.value as any)} className="text-xs border border-slate-300 rounded px-2 py-1.5 outline-none">
            <option value="All">All Verification Status</option>
            <option value="Verified">Verified</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Under Review">Under Review</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={filterExpiry} onChange={(e) => setFilterExpiry(e.target.value as any)} className="text-xs border border-slate-300 rounded px-2 py-1.5 outline-none">
            <option value="All">Any Expiry</option>
            <option value="Expired">Expired</option>
            <option value="Within 7">Within 7 days</option>
            <option value="Within 30">Within 30 days</option>
            <option value="Within 90">Within 90 days</option>
          </select>
        </div>

        {/* Document table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="py-2 px-3">Document</th>
                  <th className="py-2 px-3">Mine</th>
                  <th className="py-2 px-3">Subsidiary</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Issue Date</th>
                  <th className="py-2 px-3">Expiry Date</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Verification</th>
                  <th className="py-2 px-3">Uploaded By</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800 max-w-[180px] truncate">{d.fileName}</td>
                    <td className="py-2 px-3 text-slate-700">{d.mineName}</td>
                    <td className="py-2 px-3 text-slate-500">{d.subsidiary}</td>
                    <td className="py-2 px-3 text-slate-700">{d.documentType}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{d.issueDate}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{d.expiryDate || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${expiryTone(d.expiryStatus)}`}>{d.expiryStatus}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${verificationTone(d.verification)}`}>{d.verification}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 max-w-[140px] truncate">{d.uploadedBy}</td>
                    <td className="py-2 px-3">
                      <button onClick={() => setSelectedDoc(d)} className="text-[#004D40] font-bold hover:underline">
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDocs.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-slate-400 text-xs italic">No documents match the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl border border-slate-300 overflow-hidden">
            <div className="px-4 py-3 bg-[#004D40] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Upload Document</h3>
              <button onClick={closeUpload} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Associate with Mine</label>
                <select
                  value={uploadMineId}
                  onChange={(e) => setUploadMineId(e.target.value)}
                  disabled={!!uploadStage}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-[#004D40]"
                >
                  {MINE_LOCATIONS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.subsidiary})</option>
                  ))}
                </select>
              </div>

              {!uploadStage && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-[#004D40] bg-emerald-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <div className="text-xs font-semibold text-slate-600">Drag &amp; drop a file, or click to browse</div>
                  <div className="text-[10px] text-slate-400 mt-1">Supports PDF, JPG, PNG (scanned documents)</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(file);
                    }}
                  />
                </div>
              )}

              {uploadStage && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{uploadFileName}</span>
                  </div>
                  <div className="space-y-1.5">
                    {PROCESSING_STAGES.map((s) => {
                      const idx = PROCESSING_STAGES.indexOf(s);
                      const currentIdx = PROCESSING_STAGES.indexOf(uploadStage);
                      const done = idx < currentIdx || uploadStage === 'Complete';
                      const current = idx === currentIdx && uploadStage !== 'Complete';
                      return (
                        <div key={s} className="flex items-center space-x-2 text-xs">
                          {done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : current ? (
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span className={done ? 'text-slate-700 font-semibold' : current ? 'text-amber-700 font-semibold' : 'text-slate-400'}>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                  {ocrError && (
                    <div className="flex items-start space-x-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{ocrError}</span>
                    </div>
                  )}
                  {uploadStage === 'Complete' && (
                    <button
                      onClick={closeUpload}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded"
                    >
                      Done — View in Document Register
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedDoc && renderWorkspace(selectedDoc)}
    </div>
  );
};
