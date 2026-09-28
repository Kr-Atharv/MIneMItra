// MineMitra OCR — frontend client (Step 6).
// The file is uploaded straight to our OWN backend (server/routes/ocr.js),
// which forwards it to whatever OCR_API_URL is configured in .env. No OCR
// provider URL or key ever reaches the browser bundle — same rule as
// aiClient.ts for the Groq/Gemini key.
//
// Step 10: this is an external-API call like every other one in aiClient.ts/
// externalDataClient.ts, so it's routed through the same shared
// aiRequestQueue — a burst of document uploads (e.g. bulk-filing several
// inspection photos back-to-back) must not bypass the app-wide throttle
// any more than opening several AI risk cards would.

import { enqueueRequest } from './aiRequestQueue';

export interface OcrResult {
  ocrText: string;
  degraded: boolean;
  errorCode?: string;
}

export async function extractTextFromFile(file: File): Promise<OcrResult> {
  return enqueueRequest(async () => {
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const res = await fetch('/api/ocr/extract', { method: 'POST', body: form });
      if (res.status === 429) {
        return { ocrText: '', degraded: true, errorCode: 'RATE_LIMITED' };
      }
      if (!res.ok) {
        return { ocrText: '', degraded: true, errorCode: `HTTP_${res.status}` };
      }
      return (await res.json()) as OcrResult;
    } catch {
      return { ocrText: '', degraded: true, errorCode: 'network_error' };
    }
  });
}
