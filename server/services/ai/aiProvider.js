/**
 * MineMitra AI — provider switch.
 *
 * Set AI_PROVIDER=gemini or AI_PROVIDER=groq in .env to force one.
 * If unset, auto-picks Gemini when GEMINI_API_KEY is present, otherwise
 * falls back to Groq. This is the ONLY file routes/ai.js talks to, so
 * swapping/adding a provider never touches route or UI code.
 */

const groq = require('./groqService');
const gemini = require('./geminiService');

function activeProvider() {
  const forced = (process.env.AI_PROVIDER || '').toLowerCase();
  if (forced === 'gemini') return gemini;
  if (forced === 'groq') return groq;
  // Auto-detect: prefer whichever key is actually present.
  if (gemini.isConfigured()) return gemini;
  return groq;
}

function isConfigured() {
  return activeProvider().isConfigured();
}

async function callAI(messages, options) {
  const provider = activeProvider();
  if (provider === gemini) return gemini.callGemini(messages, options);
  return groq.callGroq(messages, options);
}

function providerName() {
  return activeProvider() === gemini ? 'gemini' : 'groq';
}

// NOTE for anyone reading this file: Gemini/Groq NEVER generate the risk
// score itself. The MineMitra Predict model (the deterministic GBDT + rule
// engine in riskEngine.js / src/lib/riskEngine.ts) always computes the
// score first; this LLM layer only explains it in plain language
// (summary, key risk factors, recommended actions). See promptBuilder.js's
// SYSTEM_PERSONA, which explicitly forbids the model from changing the
// number. -> "MineMitra Predict model generates the risk score."

module.exports = { callAI, isConfigured, providerName };
