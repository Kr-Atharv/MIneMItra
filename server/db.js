/**
 * Persistence layer — local JSON file, no external database.
 *
 * Why: MongoDB Atlas needs its own account, cluster, network-access
 * whitelist and a MONGODB_URI env var wired up correctly on the host.
 * Any one of those being missed silently drops persistence (the server
 * falls back to in-memory data with no error the person would ever see),
 * which is exactly what was happening here. A JSON file next to the
 * server code needs zero setup, zero external account and zero env var —
 * it just works the moment the server starts, on any host.
 *
 * Tradeoff worth knowing: on hosts with an ephemeral filesystem (e.g. a
 * fresh Render deploy/redeploy, or running more than one server instance
 * behind a load balancer) this file resets or can go out of sync between
 * instances. For a single-instance deployment — the default, and almost
 * certainly what you have — it persists reliably across restarts. If you
 * outgrow a single instance later, swap writeComplaints/readComplaints
 * for calls to a real database without touching any other file.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'complaints.json');

function connectDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    console.log(`[coalguard-server] Local JSON persistence ready at ${DATA_FILE}`);
    return true;
  } catch (err) {
    console.error('[coalguard-server] Could not set up local persistence — running in-memory only:', err.message);
    return false;
  }
}

// Always true once connectDB has run: a local file, unlike a remote DB,
// doesn't have a "disconnected" state to check on every request.
function isDbConnected() {
  return true;
}

function readComplaints() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[coalguard-server] Failed to read persisted complaints, starting empty:', err.message);
    return [];
  }
}

function writeComplaints(complaints) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(complaints, null, 2), 'utf8');
}

module.exports = { connectDB, isDbConnected, readComplaints, writeComplaints };
