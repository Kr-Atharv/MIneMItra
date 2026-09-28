import { useEffect, useState } from 'react';
import { searchRuleBook, RuleBookEntry } from '../lib/externalDataClient';

export interface MatchedRegulationState {
  entry: RuleBookEntry | null;
  loading: boolean;
  /** True when the underlying call itself failed (network/rate-limit) —
   * distinct from a clean "no match" from a reachable source. */
  degraded: boolean;
}

const EMPTY_STATE: MatchedRegulationState = { entry: null, loading: false, degraded: false };

/**
 * Step 7 — "when a user resolves/closes an item, show Matched regulation
 * pulled from ruleBookService.js next to that item." This hook is the one
 * place that logic lives, so StatutoryCompliance.tsx, FieldInspection.tsx
 * and CMRReferenceModal.tsx all resolve a free-text query into a clause
 * the same way, through the Step 3 request queue (searchRuleBook already
 * routes through it — see externalDataClient.ts).
 *
 * Debounced so typing/editing a corrective-action note doesn't fire a
 * lookup per keystroke. Resolves to `entry: null` (never throws, never
 * leaves a caller in a broken state) whenever the query is empty or
 * genuinely has no match anywhere — live source or local snapshot.
 */
export function useMatchedRegulation(query: string, debounceMs = 500): MatchedRegulationState {
  const [state, setState] = useState<MatchedRegulationState>(EMPTY_STATE);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setState(EMPTY_STATE);
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    const timer = setTimeout(async () => {
      const res = await searchRuleBook(trimmed);
      if (cancelled) return;
      setState({
        entry: res.results[0] || null,
        loading: false,
        degraded: Boolean(res.degraded)
      });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  return state;
}
