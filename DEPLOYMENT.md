# Deployment Guide — COALGUARD • MINEMITRA

## Why the current zip throws errors on deploy

The `node_modules` folder in your zip was installed on **Windows**. Vite,
Tailwind v4 and Rollup ship OS-specific native binaries
(`lightningcss-win32-x64-msvc`, `@rollup/rollup-win32-x64-msvc`). Any Linux
host (Render, Railway, a VPS, Docker, Vercel's build image, etc.) can't use
those — you get:

```
Error: Cannot find module '@rollup/rollup-linux-x64-gnu'
```

**Fix: never zip/commit `node_modules`. Always run `npm install` fresh on
the machine that will actually run the app.**

Also: `.env` (and even `.env.example`) had real API keys committed to git,
with no `.gitignore` in the repo. **Rotate every key below before you
deploy** — Groq, Gemini, AQI (data.gov.in), WAQI, OCR.space. Anyone with
the old zip/git history can read them.

**MongoDB has been removed.** Complaints now persist to a plain JSON file
on the server (`server/data/complaints.json`, created automatically on
first run) instead of a MongoDB Atlas cluster. No database account, no
connection string, no network-access whitelist to configure — the app
just works the moment the server starts. The one tradeoff: on a host
with an ephemeral filesystem, or if you ever run more than one server
instance behind a load balancer, that file resets on redeploy / can go
out of sync between instances. For a normal single-instance Render
deployment (the default, and what you almost certainly have) it survives
restarts fine.

---

## 1. Clean local setup (do this once)

```bash
cd MINE-C
rm -rf node_modules package-lock.json dist
npm install
```

Create your own `.env` from the template (never commit this file — it's
now in `.gitignore`):

```bash
cp .env.example .env
# then edit .env and paste in your ROTATED keys
```

## 2. Run it locally (two processes, like the README says)

```bash
# terminal 1 — backend (holds the AI keys, DB, sockets)
npm run server

# terminal 2 — frontend dev server (proxies /api to :8787)
npm run dev
```

Open http://localhost:3000.

## 3. Production build (one process serves everything)

```bash
npm run build      # builds the React app into dist/
npm run server      # Express serves dist/ AND /api/* AND socket.io, on $PORT
```

This is the command your host should run as the **start command**.

## 4. Deploying (Render / Railway / a VPS / Docker — same idea everywhere)

**Build command:**
```bash
npm install && npm run build
```

**Start command:**
```bash
npm run server
```

**Environment variables to set in the host's dashboard** (not in a
committed file):

```
AI_PROVIDER=
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
AQI_DATA_GOV_API_KEY=
WAQI_TOKEN=
OCR_API_URL=https://api.ocr.space/parse/image
OCR_API_KEY=
```

No `MONGODB_URI` or `PORT` needed — persistence is a local JSON file
created automatically, and Render injects its own `PORT` which
`server/index.js` already reads via `process.env.PORT`.

Most hosts (Render, Railway) inject their own `PORT` — `server/index.js`
already reads `process.env.PORT || 8787`, so that's fine as-is.

**Node version:** use Node 20 or 22 (project was built/tested on Node 22).

### If you deploy with Docker
```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8787
CMD ["npm", "run", "server"]
```
Do **not** `COPY node_modules` — let `npm install` run inside the
container so the binaries match the container's OS.

### Socket.IO / CORS note
`server/index.js` currently sets `cors: { origin: '*' }` for Socket.IO —
fine for a demo/hackathon, but before a real production deploy lock this
to your actual frontend origin.

---

## 5. Workflow check against your Technical Approach diagram

Verified against the actual code (`server/routes/ai.js`,
`server/services/ai/*`, `src/lib/riskEngine.ts`):

| Diagram step | Matches code? |
|---|---|
| Officer submits complaint → 5-stage lifecycle | ✅ `server/routes/complaints.js`, `RoleAuditLogModal.tsx`, real-time via Socket.IO |
| Upload document/photo → Gemini → Groq fallback → MineMitra Predict → risk score | ⚠️ Partly — see note below |
| Schema validator → extracted fields | ✅ `server/services/ai/validate.js` enforces the JSON shape before anything reaches the UI |
| Advisory escalation | ✅ handled in the complaint pipeline |
| OCR text extraction → schema validator → document records (x2) | ✅ `server/routes/ocr.js` → `ocrService.js` |
| One transparent risk formula, never a black box | ✅ `src/lib/riskEngine.ts` / `server/services/ai/riskEngine.js` — deterministic, weighted, capped; the LLM is explicitly forbidden (see `promptBuilder.js` SYSTEM_PERSONA) from changing the number |
| Role-based dashboards, RBAC-scoped | ✅ `src/lib/roleVisibility.ts`, `GovernanceContext.tsx` |

**One real gap vs. the diagram:** the diagram's arrow "Gemini → Groq
fallback" reads as a *runtime* fallback (Gemini fails → automatically
retry on Groq). The current code (`aiProvider.js`) only does a **static
pick at startup** — it uses Gemini if `GEMINI_API_KEY` is set, otherwise
Groq, but if the *chosen* provider fails mid-request it does **not**
retry on the other provider — it returns a labelled fallback response
instead (`fallbackMineAnalysis(err.code)`), so the UI never breaks, but
you don't get true cross-provider failover. If you want the diagram to be
literally accurate, `aiProvider.js`'s `callAI()` needs a `try { gemini }
catch { groq }` retry, not just a preference order.

**Clarified in code (this pass):** added comments/log lines next to where
Gemini/Groq are selected (`aiProvider.js`, `server/index.js` startup log)
making explicit that **the MineMitra Predict model (the deterministic
risk engine) always generates the risk score — Gemini/Groq only generate
the plain-language explainability narrative on top of it.** This matches
your README's own description and the diagram's "Risk score +
explainability" label, and avoids the AI provider looking like it's the
one "predicting" risk.
