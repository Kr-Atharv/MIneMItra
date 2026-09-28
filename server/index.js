/**
 * COALGUARD • MINEMITRA — backend API server.
 *
 * This is the ONLY process that ever holds GROQ_API_KEY. The React
 * frontend never talks to Groq directly — it calls this server's
 * /api/ai/* routes, which are the sole caller of the AI reasoning layer.
 *
 * Dev:  `npm run server`  (Vite dev server proxies /api to this process)
 * Prod: `npm run build && npm run server`  (this process also serves dist/)
 */

require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');
const aiRoutes = require('./routes/ai');
const externalRoutes = require('./routes/external');
const ocrRoutes = require('./routes/ocr');
const complaintsRoutes = require('./routes/complaints');
const { connectDB, isDbConnected } = require('./db');

const app = express();
const PORT = process.env.PORT || 8787;

// Wrap Express in a raw HTTP server so Socket.IO can share the same port —
// this is what makes real-time updates possible (see server/routes/complaints.js,
// which calls req.app.get('io').emit(...) after every successful write).
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' } // dev convenience; tighten this for a real deployment
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[coalguard-server] client connected (${socket.id}) — ${io.engine.clientsCount} total`);
  socket.on('disconnect', () => {
    console.log(`[coalguard-server] client disconnected (${socket.id}) — ${io.engine.clientsCount} total`);
  });
});

app.use(express.json({ limit: '1mb' }));

app.use('/api/ai', aiRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/complaints', complaintsRoutes);

// Serve the built frontend in production (after `npm run build`).
const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// connectDB() is synchronous now (local JSON file, not a remote DB with
// a connection handshake to await), so it's just called directly, then
// the server starts listening right away.
connectDB();
httpServer.listen(PORT, () => {
  const { isConfigured, providerName } = require('./services/ai/aiProvider');
  const { isConfigured: isOcrConfigured } = require('./services/external/ocrService');
  console.log(`[coalguard-server] listening on http://localhost:${PORT}`);
  console.log(`[coalguard-server] MineMitra AI engine: ${isConfigured() ? `configured (provider: ${providerName()})` : 'NOT configured (set GEMINI_API_KEY or GROQ_API_KEY in .env)'}`);
  console.log(`[coalguard-server] MineMitra Predict model generates the risk score (deterministic); ${providerName()} only generates the explainability narrative on top of it.`);
  console.log(`[coalguard-server] OCR provider: ${isOcrConfigured() ? 'configured' : 'NOT configured (set OCR_API_URL in .env)'}`);
  console.log(`[coalguard-server] Persistence (local JSON file): ${isDbConnected() ? 'ready' : 'NOT available (in-memory fallback)'}`);
  console.log(`[coalguard-server] Real-time (Socket.IO): active`);
});
