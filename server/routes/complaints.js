const express = require('express');
const router = express.Router();
const { readComplaints, writeComplaints } = require('../db');

// GET /api/complaints — full list, used on app load to hydrate state
// from the local JSON file instead of the hardcoded mock array.
//
// No role/mineId filtering here any more (that used to live server-side
// too, mirroring the client-side filter). Removed on purpose: it was the
// second moving part behind "complaint doesn't show up" — a role switch
// would re-fetch a *filtered* list and, if that request resolved out of
// order, could stomp on a complaint that just hadn't round-tripped yet.
// The client (GovernanceContext.tsx's filteredComplaintsForRole) already
// enforces who sees what; this endpoint just needs to hand back the data.
router.get('/', (req, res) => {
  try {
    const complaints = readComplaints();
    res.json({ complaints, persisted: true });
  } catch (err) {
    console.error('[complaints] GET failed:', err.message);
    res.status(500).json({ error: 'Failed to load complaints', persisted: false });
  }
});

// PUT /api/complaints/sync — overwrites the persisted file with the
// frontend's current in-memory complaints array. Called whenever that
// array changes (new submission, inspection, maintenance action, audit
// certification, etc.) so the change survives a page refresh or a server
// restart instead of living only in a React useState array.
router.put('/sync', (req, res) => {
  const { complaints } = req.body;
  if (!Array.isArray(complaints)) {
    return res.status(400).json({ error: 'Expected { complaints: ComplaintItem[] }' });
  }
  try {
    writeComplaints(complaints);
    // Broadcast to every connected client (including the sender — the
    // frontend guards against re-syncing its own echo, see
    // GovernanceContext.tsx's `suppressNextSync` ref) so other open tabs
    // or devices pick up the change without needing to reload the page.
    const io = req.app.get('io');
    if (io) io.emit('complaints:updated', complaints);
    res.json({ ok: true, synced: complaints.length, persisted: true });
  } catch (err) {
    console.error('[complaints] sync failed:', err.message);
    res.status(500).json({ error: 'Failed to sync complaints', persisted: false });
  }
});

module.exports = router;
