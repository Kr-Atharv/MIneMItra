import React from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { useMatchedRegulation } from '../hooks/useMatchedRegulation';

interface MatchedRegulationBadgeProps {
  /** Free text to match against the statute index — e.g. a regulation ID
   * plus provision description, or an audit category plus corrective
   * action note. */
  query: string;
  className?: string;
}

/**
 * Step 7 — shown next to an item as it's being resolved/closed in
 * StatutoryCompliance.tsx and FieldInspection.tsx, pulled from
 * ruleBookService.js (Step 5c). Never renders a blank/broken state: while
 * the local statute index (fallback) always has something for the four
 * cached acts, a query simply too short or with no match anywhere
 * (live or local) renders nothing at all rather than an empty box.
 */
export const MatchedRegulationBadge: React.FC<MatchedRegulationBadgeProps> = ({ query, className }) => {
  const { entry, loading, degraded } = useMatchedRegulation(query);

  if (loading && !entry) {
    return (
      <div className={`flex items-center space-x-1.5 text-[10px] text-slate-400 ${className || ''}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Matching against statute index…</span>
      </div>
    );
  }

  if (!entry) return null;

  const isOffline = entry.source === 'local-index' || entry.source === 'local-fallback';

  return (
    <div className={`flex items-start space-x-1.5 text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-900 rounded px-2 py-1.5 ${className || ''}`}>
      <BookOpen className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
      <div className="leading-snug">
        <span className="font-bold">Matched regulation:</span> {entry.act}, Section {entry.section}
        {entry.title ? <span className="text-emerald-800"> — {entry.title}</span> : null}
        {(isOffline || degraded) && (
          <span className="ml-1.5 text-[9px] uppercase font-bold text-amber-700 align-middle">
            cross-referenced against offline statute index
          </span>
        )}
      </div>
    </div>
  );
};
