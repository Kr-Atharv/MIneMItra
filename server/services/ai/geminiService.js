/**
 * MineMitra AI reasoning layer — Gemini client.
 *
 * Mirrors groqService.js exactly (same callAI(messages, opts) -> parsed JSON
 * contract) so routes/ai.js can use either provider interchangeably via
 * aiProvider.js. Only ever runs on the server — GEMINI_API_KEY never reaches
 * the browser bundle.
 */

const { GoogleGenAI } = require('@google/genai');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 15000;

// Same cap/backoff contract as groqService.js (Step 3) — kept in sync so a
// single request never blocks the shared client-side queue for more than ~6s.
const MAX_BACKOFF_MS = 6000;
const BASE_BACKOFF_MS = 1000;

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function backoffDelayMs(attempt, retryAfterHeader) {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (!Number.isNaN(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, MAX_BACKOFF_MS);
    }
  }
  return Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let client = null;
function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

// Our internal message format is always [{role:'system', content}, {role:'user', content}]
// (see promptBuilder.js) — split that into Gemini's systemInstruction + contents shape.
function splitMessages(messages) {
  const systemMsg = messages.find((m) => m.role === 'system');
  const userMsgs = messages.filter((m) => m.role !== 'system');
  return {
    systemInstruction: systemMsg ? systemMsg.content : undefined,
    contents: userMsgs.map((m) => m.content).join('\n\n')
  };
}

async function callGemini(messages, { temperature = 0.2, maxRetries = 1 } = {}) {
  if (!isConfigured()) {
    const err = new Error('AI service is not configured.');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const { systemInstruction, contents } = splitMessages(messages);
  let lastError;
  let retryDelayMs = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (retryDelayMs > 0) await sleep(retryDelayMs);
    retryDelayMs = 0;
    try {
      const ai = getClient();
      const response = await Promise.race([
        ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents,
          config: {
            systemInstruction,
            temperature,
            responseMimeType: 'application/json'
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('Gemini request timed out'), { code: 'AI_TIMEOUT' })), REQUEST_TIMEOUT_MS))
      ]);

      const text = response?.text;
      if (!text) {
        const err = new Error('Gemini API response did not contain text content.');
        err.code = 'AI_EMPTY_RESPONSE';
        throw err;
      }

      try {
        return JSON.parse(text);
      } catch (parseErr) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch (_) {
            // fall through
          }
        }
        const err = new Error('Gemini API returned a response that was not valid JSON.');
        err.code = 'AI_MALFORMED_JSON';
        throw err;
      }
    } catch (err) {
      lastError = err;
      if (!err.code) {
        // Errors thrown by the SDK for HTTP failures (401/404/429) carry a
        // `status` or message we can map to the same codes routes/ai.js logs.
        const msg = String(err.message || '');
        if (err.status === 401 || /API key/i.test(msg)) err.code = 'AI_INVALID_API_KEY';
        else if (err.status === 429 || /quota|rate/i.test(msg)) err.code = 'RATE_LIMITED';
        else if (err.status === 404 || /not found/i.test(msg)) err.code = 'AI_MODEL_NOT_FOUND';
        else err.code = 'AI_UPSTREAM_ERROR';
      }
      console.error(`[geminiService] ${err.code}: ${err.message}`);
      if (err.code === 'RATE_LIMITED') {
        // The SDK rarely surfaces a Retry-After header directly; fall back
        // to the same exponential backoff as groqService.js when absent.
        const retryAfterHeader = err?.response?.headers?.get?.('retry-after');
        retryDelayMs = backoffDelayMs(attempt, retryAfterHeader);
      }
      if (err.code === 'AI_MALFORMED_JSON' || err.code === 'AI_NOT_CONFIGURED') break;
    }
  }
  throw lastError;
}

module.exports = { callGemini, isConfigured, DEFAULT_MODEL };
