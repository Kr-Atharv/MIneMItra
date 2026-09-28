import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  ShieldCheck,
  Scale,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  History,
  Globe,
  HardDrive,
  Loader2
} from 'lucide-react';
import { OFFICIAL_CMR_REGULATIONS } from '../data/statutoryRules';
import { StatutoryRuleClause } from '../types';
import { IndiaEmblem } from './OfficialLogos';
import { searchRuleBook, RuleBookEntry } from '../lib/externalDataClient';

interface CMRReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Step 7 — CMR study layout rework. Previously a single flat scrolling
 * list; this replaces it with:
 *  - a collapsible chapter/section tree (chapters = statutes) on the left,
 *  - a search bar that ALSO queries ruleBookService.js (Step 5c) for
 *    statutes beyond the four locally-authored CMR clauses (Environment
 *    Protection Act 1986, Contract Labour Act 1970, etc.),
 *  - a "recently viewed clauses" list so officers can jump back to what
 *    they were studying,
 * with a detail pane on the right instead of everything being inline.
 *
 * The four locally-authored OFFICIAL_CMR_REGULATIONS entries are shown
 * as-is (unchanged content) inside the tree. Anything found only via the
 * live/local statute index (ruleBookService.js) is shown in a separate
 * "Extended Statute Index" section of the tree, clearly labeled with its
 * source (live vs offline snapshot) — never presented as an official
 * government API result, per the Step 5c labeling requirement.
 */

type LocalClause = { kind: 'local'; data: StatutoryRuleClause };
type ExtendedClause = { kind: 'extended'; data: RuleBookEntry };
type SelectedClause = LocalClause | ExtendedClause;

interface RecentEntry {
  kind: 'local' | 'extended';
  key: string;
  title: string;
  subtitle: string;
}

const RECENTS_STORAGE_KEY = 'minemitra.cmrReference.recentlyViewed.v1';
const MAX_RECENTS = 6;

function loadRecents(): RecentEntry[] {
  try {
    const raw = window.localStorage.getItem(RECENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    // Corrupt/blocked storage should never break the modal.
    return [];
  }
}

function saveRecents(entries: RecentEntry[]) {
  try {
    window.localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_RECENTS)));
  } catch {
    // Best-effort only — private browsing / storage-disabled should not error out.
  }
}

const STATUTE_GROUPS: StatutoryRuleClause['statute'][] = ['CMR 2017', 'Mines Act 1952', 'Mines Rules 1955'];

export const CMRReferenceModal: React.FC<CMRReferenceModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'CMR 2017': true,
    'Mines Act 1952': true,
    'Mines Rules 1955': true,
    'Extended Statute Index': false
  });
  const [selected, setSelected] = useState<SelectedClause | null>(null);
  const [recents, setRecents] = useState<RecentEntry[]>(() => loadRecents());

  const [extendedResults, setExtendedResults] = useState<RuleBookEntry[]>([]);
  const [extendedSource, setExtendedSource] = useState<string | null>(null);
  const [extendedLoading, setExtendedLoading] = useState(false);

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

  // Step 7: search bar backed by ruleBookService.js, in addition to
  // filtering the locally-authored clauses below. Debounced, and only
  // fires for queries specific enough to be worth a lookup. searchRuleBook
  // already routes through the shared aiRequestQueue (Step 3) and falls
  // back to the local statuteIndex.json snapshot automatically if the
  // live third-party mirror is unreachable — so this never leaves the
  // "Extended Statute Index" section blank/broken, only empty when there
  // really is no match anywhere.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setExtendedResults([]);
      setExtendedSource(null);
      setExtendedLoading(false);
      return;
    }
    let cancelled = false;
    setExtendedLoading(true);
    const timer = setTimeout(async () => {
      const res = await searchRuleBook(q);
      if (cancelled) return;
      setExtendedResults(res.results || []);
      setExtendedSource(res.source);
      setExtendedLoading(false);
      setOpenGroups((g) => ({ ...g, 'Extended Statute Index': true }));
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  const filteredLocalRules = OFFICIAL_CMR_REGULATIONS.filter((rule) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rule.regulationNumber.toLowerCase().includes(q) ||
      rule.title.toLowerCase().includes(q) ||
      rule.summary.toLowerCase().includes(q)
    );
  });

  const localByStatute = (statute: StatutoryRuleClause['statute']) =>
    filteredLocalRules.filter((r) => r.statute === statute);

  const toggleGroup = (key: string) => {
    setOpenGroups((g) => ({ ...g, [key]: !g[key] }));
  };

  const recordRecent = (entry: RecentEntry) => {
    setRecents((prev) => {
      const next = [entry, ...prev.filter((e) => e.key !== entry.key)].slice(0, MAX_RECENTS);
      saveRecents(next);
      return next;
    });
  };

  const selectLocal = (rule: StatutoryRuleClause) => {
    setSelected({ kind: 'local', data: rule });
    recordRecent({
      kind: 'local',
      key: `local:${rule.regulationNumber}`,
      title: rule.regulationNumber,
      subtitle: rule.title
    });
  };

  const selectExtended = (entry: RuleBookEntry) => {
    setSelected({ kind: 'extended', data: entry });
    recordRecent({
      kind: 'extended',
      key: `ext:${entry.act}|${entry.section}`,
      title: `${entry.act} · Sec ${entry.section}`,
      subtitle: entry.title || entry.summary.slice(0, 60)
    });
  };

  const reopenRecent = (recent: RecentEntry) => {
    if (recent.kind === 'local') {
      const rule = OFFICIAL_CMR_REGULATIONS.find((r) => `local:${r.regulationNumber}` === recent.key);
      if (rule) selectLocal(rule);
      return;
    }
    const [act, section] = recent.key.replace('ext:', '').split('|');
    const fromResults = extendedResults.find((e) => e.act === act && e.section === section);
    if (fromResults) {
      setSelected({ kind: 'extended', data: fromResults });
      return;
    }
    // Not in the current search results (e.g. reopened after clearing the
    // search box) — reconstruct a minimal record from what we stored
    // rather than showing nothing.
    setSelected({ kind: 'extended', data: { act, section, title: recent.subtitle, summary: recent.subtitle, source: 'local-index' } });
  };

  const sourceBadge = (source: string) => {
    const isLive = source === 'live';
    return (
      <span
        className={`inline-flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
          isLive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-300'
        }`}
        title={isLive ? 'Fetched live from the structured statute-text index' : 'Served from the offline statute snapshot (statuteIndex.json)'}
      >
        {isLive ? <Globe className="w-2.5 h-2.5" /> : <HardDrive className="w-2.5 h-2.5" />}
        <span>{isLive ? 'Live index' : 'Offline snapshot'}</span>
      </span>
    );
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-4"
      >
        {/* Header */}
        <div className="bg-[#004D40] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-emerald-800/80 rounded-lg border border-emerald-600">
              <IndiaEmblem size={28} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 px-2 py-0.5 rounded text-emerald-300 border border-emerald-700/50">
                  Statutory Rulebook
                </span>
                <span className="text-xs text-emerald-200">DGMS &amp; Ministry of Coal</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Coal Mines Regulations 2017 &amp; Mines Act 1952 Reference Manual
              </h3>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by regulation number, hazard topic, or statute keyword (e.g. Reg 106, 'blasting', 'contract labour')..."
              className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 focus:border-teal-700 outline-none"
            />
            {extendedLoading && (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            2+ characters also cross-references against a structured statute-text index (Mines Act 1952, CMR 2017, Environment Protection Act 1986 &amp; Contract Labour Act 1970) — not an official government API.
          </p>
        </div>

        {/* Body: tree + detail */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left: collapsible chapter/section tree + recently viewed */}
          <div className="w-full sm:w-80 border-r border-slate-200 overflow-y-auto flex flex-col shrink-0 bg-white">
            <div className="flex-1">
              {STATUTE_GROUPS.map((statute) => {
                const rules = localByStatute(statute);
                if (searchQuery.trim() && rules.length === 0) return null;
                const isOpenGroup = openGroups[statute];
                return (
                  <div key={statute} className="border-b border-slate-100">
                    <button
                      onClick={() => toggleGroup(statute)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                        {isOpenGroup ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>{statute}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{rules.length}</span>
                    </button>
                    {isOpenGroup && (
                      <div className="pb-1">
                        {rules.map((rule) => (
                          <button
                            key={rule.regulationNumber}
                            onClick={() => selectLocal(rule)}
                            className={`w-full text-left pl-8 pr-3 py-2 text-xs border-l-2 transition-colors ${
                              selected !== null && selected.kind === 'local' && selected.data.regulationNumber === rule.regulationNumber
                                ? 'border-l-[#004D40] bg-emerald-50 text-[#004D40] font-bold'
                                : 'border-l-transparent text-slate-600 hover:bg-slate-50 hover:border-l-slate-300'
                            }`}
                          >
                            <div className="font-mono text-[10px] font-bold">{rule.regulationNumber}</div>
                            <div className="truncate">{rule.title}</div>
                          </button>
                        ))}
                        {rules.length === 0 && (
                          <div className="pl-8 pr-3 py-2 text-[11px] text-slate-400 italic">No matches in this chapter.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Extended Statute Index — live/local ruleBookService.js results,
                  kept visually distinct from the four hand-authored chapters above. */}
              {searchQuery.trim().length >= 2 && (
                <div className="border-b border-slate-100">
                  <button
                    onClick={() => toggleGroup('Extended Statute Index')}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 bg-slate-50/60"
                  >
                    <span className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                      {openGroups['Extended Statute Index'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <span>Extended Statute Index</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{extendedResults.length}</span>
                  </button>
                  {openGroups['Extended Statute Index'] && (
                    <div className="pb-1">
                      {extendedLoading && extendedResults.length === 0 && (
                        <div className="pl-8 pr-3 py-2 text-[11px] text-slate-400 italic flex items-center space-x-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" /> <span>Searching statute index…</span>
                        </div>
                      )}
                      {!extendedLoading && extendedResults.length === 0 && (
                        <div className="pl-8 pr-3 py-2 text-[11px] text-slate-400 italic">No statute-index matches for &quot;{searchQuery}&quot;.</div>
                      )}
                      {extendedResults.map((entry) => (
                        <button
                          key={`${entry.act}-${entry.section}`}
                          onClick={() => selectExtended(entry)}
                          className={`w-full text-left pl-8 pr-3 py-2 text-xs border-l-2 transition-colors ${
                            selected !== null && selected.kind === 'extended' && selected.data.act === entry.act && selected.data.section === entry.section
                              ? 'border-l-[#004D40] bg-emerald-50 text-[#004D40] font-bold'
                              : 'border-l-transparent text-slate-600 hover:bg-slate-50 hover:border-l-slate-300'
                          }`}
                        >
                          <div className="font-mono text-[10px] font-bold">{entry.act} · Sec {entry.section}</div>
                          <div className="truncate">{entry.title || entry.summary}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recently viewed clauses */}
            <div className="border-t border-slate-200 bg-slate-50/60 p-3 shrink-0">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                <History className="w-3 h-3" />
                <span>Recently viewed</span>
              </div>
              {recents.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">Clauses you open will appear here for quick return.</p>
              ) : (
                <div className="space-y-1">
                  {recents.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => reopenRecent(r)}
                      className="w-full text-left px-2 py-1.5 rounded text-[11px] bg-white border border-slate-200 hover:border-teal-600 transition-colors"
                    >
                      <div className="font-mono font-bold text-[#004D40] text-[10px]">{r.title}</div>
                      <div className="truncate text-slate-500">{r.subtitle}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: detail pane */}
          <div className="flex-1 overflow-y-auto p-6 hidden sm:block">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <BookOpen className="w-8 h-8" />
                <p className="text-xs max-w-xs">
                  Pick a clause from the chapter tree on the left, or search above — results appear here for study.
                </p>
              </div>
            ) : selected.kind === 'local' ? (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#004D40] bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded font-mono">
                      {selected.data.regulationNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {selected.data.statute}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center space-x-1">
                    <span className="font-semibold text-slate-700">Audit SLA:</span>
                    <span>{selected.data.mandatoryInspectionInterval}</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-2">{selected.data.title}</h4>

                <p className="text-xs text-slate-700 leading-relaxed mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                  {selected.data.summary}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] pt-2 border-t border-slate-100 gap-2">
                  <div className="flex items-center space-x-1.5 text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span><strong>Statutory Penalty:</strong> {selected.data.penaltyClause}</span>
                  </div>
                  <span className="text-slate-500 font-medium">
                    Enforcing Role: <strong className="text-slate-800 uppercase">{selected.data.responsibleOfficerRole.replace('_', ' ')}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#004D40] bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded font-mono">
                      {selected.data.act} · Sec {selected.data.section}
                    </span>
                    {sourceBadge(selected.data.source)}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">{selected.data.title || 'Untitled section'}</h4>
                <p className="text-xs text-slate-700 leading-relaxed mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                  {selected.data.summary}
                </p>
                <div className="flex items-start space-x-1.5 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    Cross-referenced against a structured statute-text index, not an official government API — indiacode.nic.in does not publish a documented public one. Verify against the official Gazette before formal use.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Directorate General of Mines Safety (DGMS) Official Gazette</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#004D40] text-white font-bold rounded-lg hover:bg-[#00382e] text-xs transition-colors"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};
