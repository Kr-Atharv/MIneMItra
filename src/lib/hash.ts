/**
 * Real SHA-256 hashing via the browser's native Web Crypto API
 * (window.crypto.subtle — available in every modern browser, no library needed).
 *
 * This replaces the previous mock hash generator
 * (`Array.from({length:64}, () => Math.random()...)`) which produced a
 * random-looking string that had no relationship to the file's actual
 * content. These functions compute a genuine cryptographic digest:
 * the same file always produces the same hash, and changing a single
 * byte of the file changes the hash completely — which is the actual
 * property a "tamper-evident" claim depends on.
 */

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** SHA-256 digest (lowercase hex) of an ArrayBuffer. */
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(digest);
}

/** SHA-256 digest of a real uploaded File/Blob's actual bytes. */
export async function sha256OfFile(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  return sha256Hex(buffer);
}

/**
 * SHA-256 digest of a UTF-8 string. Used only as a fallback for demo
 * flows that simulate an evidence capture without a real uploaded file
 * (e.g. the "quick log" button in Field Inspection) — the digest is a
 * genuine hash, but of placeholder metadata rather than of real photo
 * bytes. Prefer sha256OfFile whenever an actual File object exists.
 */
export async function sha256OfText(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  return sha256Hex(encoded.buffer as ArrayBuffer);
}
