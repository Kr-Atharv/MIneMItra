/**
 * MineMitra OCR routes (Step 6). Mirrors routes/ai.js and
 * routes/external.js's contract: always answers 200 with a
 * `degraded`/`errorCode` payload on failure so the frontend has one
 * consistent shape to render regardless of *why* OCR failed (provider not
 * configured, rate-limited, network error, etc.) instead of a raw
 * non-2xx status or a blank body.
 */

const express = require('express');
const multer = require('multer');
const { extractText, isConfigured } = require('../services/external/ocrService');

const router = express.Router();

// Memory storage — files are forwarded straight to the OCR provider and
// never written to disk on this server. 15MB comfortably covers a
// scanned statutory-document photo/PDF.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

router.get('/health', (req, res) => {
  res.json({ ok: true, ocrConfigured: isConfigured() });
});

router.post('/extract', (req, res) => {
  upload.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) {
      const code = uploadErr.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR';
      return res.status(400).json({ error: uploadErr.message, code });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'file is required (multipart/form-data field "file").' });
    }
    if (!isConfigured()) {
      return res.json({ ocrText: '', degraded: true, errorCode: 'OCR_NOT_CONFIGURED' });
    }
    try {
      const { text } = await extractText(req.file.buffer, req.file.originalname, req.file.mimetype);
      res.json({ ocrText: text, degraded: false });
    } catch (err) {
      console.error('[ocr/extract]', err.code || err.message);
      res.json({ ocrText: '', degraded: true, errorCode: err.code || 'OCR_ERROR', errorMessage: err.message });
    }
  });
});

module.exports = router;
