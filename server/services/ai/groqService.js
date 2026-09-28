/**
 * MineMitra AI reasoning layer — Groq client.
 *
 * IMPORTANT: this file only ever runs on the server. GROQ_API_KEY is read
 * from process.env (populated via .env / real deployment secrets) and is
 * never sent to, or readable by, the browser. The LLM provider is
 * abstracted behind the functions below so it can be swapped later
 * without touching route/UI code (spec Section 20).
 */

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
// llama-3.3-70b-versatile was decommissioned by Groq on 16 Aug 2026 — default
// to its recommended replacement if GROQ_MODEL isn't set. Override via .env.
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const REQUEST_TIMEOUT_MS = 15000;

// A single request must never block the shared client-side queue
// (aiRequestQueue.ts) for more than ~6s, no matter how the upstream
// responds — this caps the 429 backoff delay computed below.
const MAX_BACKOFF_MS = 6000;
const BASE_BACKOFF_MS = 1000;

function isConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

// Spec (Step 3): on a 429, honor Retry-After if the upstream sent one,
// otherwise fall back to exponential backoff (1000ms * 2^attempt), capped.
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

async function callGroq(messages, { temperature = 0.2, maxRetries = 1 } = {}) {
  if (!isConfigured()) {
    const err = new Error('AI service is not configured.');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  let lastError;
  let retryDelayMs = 0;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    // Root-cause fix (Step 3): this used to retry immediately with zero
    // delay, which is exactly what turned one 429 into a burst of them.
    if (retryDelayMs > 0) await sleep(retryDelayMs);
    retryDelayMs = 0;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages,
          temperature,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        // Surface the REAL reason (bad key, decommissioned model, rate limit,
        // etc.) in the server log instead of a bare "AI_UPSTREAM_ERROR" code,
        // so this is debuggable from `npm run server` output alone.
        let reason = text.slice(0, 500);
        try {
          const parsedBody = JSON.parse(text);
          reason = parsedBody?.error?.message || parsedBody?.error?.code || reason;
        } catch (_) {
          // body wasn't JSON, keep raw text
        }
        console.error(`[groqService] Groq API ${response.status}: ${reason}`);
        const err = new Error(`Groq API responded with ${response.status}: ${reason}`);
        err.code =
          response.status === 401 ? 'AI_INVALID_API_KEY'
          : response.status === 429 ? 'RATE_LIMITED'
          : response.status === 404 ? 'AI_MODEL_NOT_FOUND'
          : 'AI_UPSTREAM_ERROR';
        err.status = response.status;
        if (response.status === 429) {
          retryDelayMs = backoffDelayMs(attempt, response.headers.get('retry-after'));
        }
        throw err;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        const err = new Error('Groq API response did not contain message content.');
        err.code = 'AI_EMPTY_RESPONSE';
        throw err;
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseErr) {
        // Reasoning models (gpt-oss-*) occasionally wrap JSON in ```fences```
        // or leave stray reasoning text around it even in json_object mode.
        // Try to recover the first {...} block before giving up.
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch (_) {
            // fall through to the error below
          }
        }
        if (!parsed) {
          const err = new Error('Groq API returned a response that was not valid JSON.');
          err.code = 'AI_MALFORMED_JSON';
          throw err;
        }
      }

      return parsed;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      // Only retry on transient/network errors, not on malformed-content errors.
      if (err.code === 'AI_MALFORMED_JSON' || err.code === 'AI_NOT_CONFIGURED') break;
    }
  }
  throw lastError;
}

module.exports = { callGroq, isConfigured, DEFAULT_MODEL };
