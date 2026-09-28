/**
 * MineMitra external data — OCR (Step 6).
 *
 * This process is the ONLY thing that ever calls the OCR provider —
 * mirrors the rule already used for the Groq/Gemini AI layer
 * (server/services/ai/*) and the weather/AQI clients (server/services/
 * external/*): secrets and provider URLs live only in .env on the
 * server, never in the browser bundle.
 *
 * No OCR provider is hardcoded. Set in .env:
 *   OCR_API_URL   — the full endpoint the file gets POSTed to
 *   OCR_API_KEY   — optional; sent both as an `apikey` form field/header
 *                   (OCR.space-style) and as `Authorization: Bearer ...`
 *                   (generic-API-style) so most providers "just work"
 *                   without code changes. Unused headers are ignored by
 *                   providers that don't expect them.
 *
 * Response parsing supports the common shapes out of the box: OCR.space's
 * `{ParsedResults:[{ParsedText}]}`, and generic `{text}` / `{ocrText}` /
 * `{result:{text}}` / `{data:{text}}` / a bare text response.
 */

const REQUEST_TIMEOUT_MS = 30000; // OCR can be slower than a weather call

function isConfigured() {
  return Boolean(process.env.OCR_API_URL && process.env.OCR_API_URL.trim());
}

function extractTextFromResponse(payload) {
  if (typeof payload === 'string') return payload.trim();
  if (!payload || typeof payload !== 'object') return '';

  // OCR.space shape
  if (Array.isArray(payload.ParsedResults)) {
    if (payload.IsErroredOnProcessing) {
      const message = Array.isArray(payload.ErrorMessage) ? payload.ErrorMessage.join('; ') : payload.ErrorMessage || 'OCR provider reported an error.';
      const err = new Error(message);
      err.code = 'OCR_PROVIDER_ERROR';
      throw err;
    }
    return payload.ParsedResults.map((r) => r.ParsedText || '').join('\n').trim();
  }

  if (typeof payload.text === 'string') return payload.text.trim();
  if (typeof payload.ocrText === 'string') return payload.ocrText.trim();
  if (payload.result && typeof payload.result.text === 'string') return payload.result.text.trim();
  if (payload.data && typeof payload.data.text === 'string') return payload.data.text.trim();

  return '';
}

/**
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {string} mimeType
 */
async function extractText(fileBuffer, fileName, mimeType) {
  if (!isConfigured()) {
    const err = new Error('OCR_API_URL is not set in .env.');
    err.code = 'OCR_NOT_CONFIGURED';
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const form = new FormData();
    form.append('file', new Blob([fileBuffer], { type: mimeType || 'application/octet-stream' }), fileName);
    if (process.env.OCR_API_KEY) {
      // OCR.space and a few similar free APIs expect the key as a form
      // field rather than (or in addition to) a header.
      form.append('apikey', process.env.OCR_API_KEY);
    }

    const headers = {};
    if (process.env.OCR_API_KEY) {
      headers.apikey = process.env.OCR_API_KEY;
      headers.Authorization = `Bearer ${process.env.OCR_API_KEY}`;
    }

    const response = await fetch(process.env.OCR_API_URL, {
      method: 'POST',
      headers,
      body: form,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const err = new Error(`OCR provider responded with ${response.status}`);
      err.code = response.status === 429 ? 'RATE_LIMITED' : 'OCR_UPSTREAM_ERROR';
      err.status = response.status;
      throw err;
    }

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();
    const text = extractTextFromResponse(payload);
    if (!text) {
      const err = new Error('OCR provider returned no extractable text.');
      err.code = 'OCR_EMPTY_RESULT';
      throw err;
    }
    return { text, source: process.env.OCR_API_URL };
  } catch (err) {
    clearTimeout(timeout);
    if (!err.code) err.code = err.name === 'AbortError' ? 'OCR_TIMEOUT' : 'OCR_NETWORK_ERROR';
    throw err;
  }
}

module.exports = { extractText, isConfigured };
