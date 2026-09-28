/**
 * MineMitra AI — prompt construction.
 *
 * The model never invents underlying statistics. It only interprets the
 * structured, already-calculated data it is given (Section 5/6/19 of the
 * AI Risk & Analytics Engine spec).
 */

const SYSTEM_PERSONA = `You are "MineMitra AI", the governance intelligence layer embedded inside the COALGUARD • MINEMITRA coal mine safety & statutory compliance platform (DGMS / Ministry of Coal, Government of India).

Your job is to INTERPRET structured, already-calculated risk data that the platform gives you. You never invent facts.

STRICT RULES:
- Never invent mine information, violations, inspection results, legal provisions, DGMS orders, statistics, dates, or documents that are not present in the provided data.
- The numerical risk score is ALREADY CALCULATED deterministically by the platform. You must not change it, recompute it, or state a different number. You only explain it.
- If the data given to you is insufficient to support part of an answer, say so explicitly: "Insufficient data available for this assessment." Do not fill gaps with assumptions.
- Distinguish clearly between: verified application data (facts given to you), calculated metrics (numbers given to you), and your own interpretation/recommendation.
- Do not claim to be performing scientific machine-learning prediction. Any forward-looking statement must be labelled as a trend-based projection, not a scientific forecast.
- Keep language plain, factual, and appropriate for a government regulatory audience. No hype, no marketing language, no emojis.
- Always respond with STRICT JSON matching the schema you are given in the user message. No markdown, no prose outside the JSON object.`;

const jsonInstruction = (schemaDescription) =>
  `Respond with a single JSON object only — no markdown fences, no commentary before or after. The JSON object must match this shape exactly:\n${schemaDescription}`;

const MINE_ANALYSIS_SCHEMA = `{
  "riskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "summary": string (2-3 sentences explaining the risk in plain language),
  "keyRiskFactors": string[] (3-6 short factual bullet points, each grounded in the provided data),
  "recurringPatterns": string[] (0-4 items; empty array if none provided),
  "anomalies": string[] (0-4 items; empty array if none detected in the provided data),
  "recommendedActions": string[] (2-5 concrete, specific actions),
  "priority": "ROUTINE" | "MONITOR" | "URGENT" | "IMMEDIATE",
  "confidence": number (0-1, your confidence that the summary faithfully reflects the provided data, not a claim of statistical certainty)
}`;

const SUBSIDIARY_SCHEMA = `{
  "items": [
    {
      "subsidiary": string,
      "riskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
      "trend": "IMPROVING" | "STABLE" | "INCREASING",
      "note": string (one short sentence grounded only in the provided data)
    }
  ]
}`;

const GOVERNANCE_SUMMARY_SCHEMA = `{
  "headline": string (one sentence executive summary),
  "highlights": string[] (3-6 short bullet points, each a fact drawn only from the provided data, e.g. counts of mines/violations/overdue items),
  "priority": "ROUTINE" | "MONITOR" | "URGENT" | "IMMEDIATE"
}`;

const ASK_SCHEMA = `{
  "answer": string (direct answer to the question, grounded only in the provided context data; if the context does not contain enough information, answer exactly "Insufficient data available for this assessment." for the relevant part),
  "citedData": string[] (short list of the specific data points from the context you used, e.g. "Mine X compliance 82%"),
  "followUpSuggestions": string[] (0-3 short related questions the user could ask next)
}`;

function buildMineAnalysisPrompt(mineProfile) {
  return [
    { role: 'system', content: SYSTEM_PERSONA },
    {
      role: 'user',
      content: `${jsonInstruction(MINE_ANALYSIS_SCHEMA)}\n\nHere is the structured, pre-calculated risk data for one mine. The riskScore and riskBand are already final — explain them, do not restate a different number.\n\n${JSON.stringify(mineProfile, null, 2)}`
    }
  ];
}

function buildSubsidiaryPrompt(subsidiaryProfiles) {
  return [
    { role: 'system', content: SYSTEM_PERSONA },
    {
      role: 'user',
      content: `${jsonInstruction(SUBSIDIARY_SCHEMA)}\n\nHere is the structured, pre-calculated performance data for each subsidiary. Do not invent subsidiaries or figures not present below.\n\n${JSON.stringify(subsidiaryProfiles, null, 2)}`
    }
  ];
}

function buildGovernanceSummaryPrompt(orgProfile) {
  return [
    { role: 'system', content: SYSTEM_PERSONA },
    {
      role: 'user',
      content: `${jsonInstruction(GOVERNANCE_SUMMARY_SCHEMA)}\n\nHere is the structured, organization-wide governance data, already calculated by the platform. Summarize it factually for the Corporate Director; do not add figures that are not present.\n\n${JSON.stringify(orgProfile, null, 2)}`
    }
  ];
}

function buildAskPrompt(question, context, roleLabel) {
  return [
    { role: 'system', content: SYSTEM_PERSONA },
    {
      role: 'user',
      content: `${jsonInstruction(ASK_SCHEMA)}\n\nThe user asking is a "${roleLabel}" and can only see the data below (their existing role permissions in the platform already limited what was retrieved for you — do not speculate about data outside this context).\n\nCONTEXT DATA:\n${JSON.stringify(context, null, 2)}\n\nQUESTION:\n${question}`
    }
  ];
}

module.exports = {
  buildMineAnalysisPrompt,
  buildSubsidiaryPrompt,
  buildGovernanceSummaryPrompt,
  buildAskPrompt
};
