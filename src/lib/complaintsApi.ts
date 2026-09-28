import { ComplaintItem } from '../types';

/**
 * Talks to the backend's /api/complaints routes (server/routes/complaints.js),
 * which persist to a local JSON file (see server/db.js — no external
 * database to configure). Every function here fails soft: if the backend
 * is unreachable, these resolve to null / false instead of throwing, so
 * the app can keep working off in-memory seed data exactly as it did
 * before this existed.
 *
 * Who sees what (mine boundary, role-based queues) is enforced entirely
 * client-side by GovernanceContext.tsx's filteredComplaintsForRole — this
 * fetch always returns the full list, unfiltered.
 */
export async function fetchPersistedComplaints(): Promise<ComplaintItem[] | null> {
  try {
    const res = await fetch('/api/complaints');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.persisted || !Array.isArray(data.complaints)) return null;
    return data.complaints as ComplaintItem[];
  } catch {
    return null;
  }
}

export async function syncComplaints(complaints: ComplaintItem[]): Promise<boolean> {
  try {
    const res = await fetch('/api/complaints/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaints })
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.persisted);
  } catch {
    return false;
  }
}
