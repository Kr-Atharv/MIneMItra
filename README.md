<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/57e23384-b507-4641-ac42-23935ddf370e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## MineMitra AI — Risk & Analytics Engine

The app now includes an AI governance intelligence layer ("MineMitra AI",
Groq-backed under the hood) that interprets deterministic, already-calculated
risk data — Governance Overview's AI Risk Cards, the "Ask Governance AI"
panel, and the AI Governance Intelligence summary for the Corporate Director
and Regulatory Authority views.

**Architecture:** `React frontend → this app's own /api/ai/* backend → AI service`.
The frontend never calls the AI provider directly and never sees the API key.

**Setup:**
1. Put your key in `.env` (already gitignored) at the project root:
   ```
   GROQ_API_KEY=your_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   PORT=8787
   ```
2. In development, run both processes (two terminals):
   ```
   npm run server   # backend on :8787, holds the API key
   npm run dev      # Vite dev server on :3000, proxies /api to :8787
   ```
3. In production, build once and let the backend serve everything:
   ```
   npm run build
   npm run server   # serves dist/ AND /api/ai/* from one process
   ```

If the AI service is unreachable or misconfigured, every `/api/ai/*` route
returns a safe, clearly-labelled fallback instead of erroring — the rest of
the dashboard (including the deterministic risk scores) is unaffected.

## Persistence (local JSON file) & SHA-256 evidence hashing

**Complaints persistence.** Complaint records (submissions, inspections,
maintenance actions, audit certifications) live in a plain JSON file on
the server (`server/data/complaints.json`) instead of only in a React
`useState` array (`src/data/complaintSeed.ts` is still the initial seed).

1. Nothing to set up — `npm run server` creates `server/data/complaints.json`
   automatically on first run if it doesn't already exist.
2. Routes: `GET /api/complaints` (load), `PUT /api/complaints/sync`
   (overwrites the whole current list — see `server/routes/complaints.js`
   for why that's the current approach and what a follow-up per-action API
   would look like).
3. Tradeoff: this is a file on local disk, so it works reliably for a
   single server instance but won't survive a host with an ephemeral
   filesystem across redeploys, or stay in sync across multiple instances
   behind a load balancer. Swap `server/db.js`'s `readComplaints` /
   `writeComplaints` for a real database later if you outgrow that.

**SHA-256 evidence hashing.** File uploads (`NewComplaintModal`,
`ComplaintDetailModal`) now compute a real SHA-256 digest of the actual
uploaded file's bytes via the browser's native Web Crypto API
(`src/lib/hash.ts`) — the same file always hashes the same, and any change
to the file changes the digest. This replaces the previous placeholder
(`Math.random()`-generated hex string). The one remaining simulated flow
(Field Inspection's "quick log" demo button, which has no real file to
hash) hashes deterministic metadata instead — a real digest, just not of
real photo bytes, since there's no real photo in that flow yet.

