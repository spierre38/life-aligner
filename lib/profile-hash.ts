/**
 * profile-hash.ts
 *
 * Generates a stable SHA-256 fingerprint of the parts of a user's LifeFrame
 * profile that the AI coaching prompt is built from:
 *   - Their selected values
 *   - Their interests (existing + exploring)
 *   - Their life categories
 *
 * Why we hash:
 *   When the AI generates coaching content for a goal, we store the hash
 *   that was current at generation time. On subsequent visits, if the hash
 *   hasn't changed, we return the cached content without hitting Anthropic.
 *   This cuts token costs dramatically for users who don't update their
 *   LifeFrame often.
 *
 * Stability guarantee:
 *   The same profile snapshot ALWAYS produces the same hash. To achieve
 *   this, we JSON.stringify with sorted keys (via replacer) before hashing
 *   so that object key order doesn't affect the output.
 *
 * Runtime:
 *   Uses the Web Crypto API (crypto.subtle) which is available in:
 *     - Node.js 18+  (we're on 24.x)
 *     - All modern browsers
 *   No external package needed.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The subset of workbook data that feeds into the AI prompt.
 * Using `unknown` intentionally — we normalize defensively inside
 * so callers don't need to pre-shape their data.
 */
export interface ProfileSnapshot {
  values: unknown;
  interests: unknown;
  life_categories: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * JSON.stringify replacer that sorts object keys alphabetically.
 * This ensures `{ b: 1, a: 2 }` and `{ a: 2, b: 1 }` produce the same string,
 * which is required for a stable hash.
 */
function sortedReplacer(_key: string, value: unknown): unknown {
  // Only reorder plain objects — leave arrays, primitives, and null as-is.
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.keys(value as object)
      .sort()
      .reduce<Record<string, unknown>>((sorted, k) => {
        sorted[k] = (value as Record<string, unknown>)[k];
        return sorted;
      }, {});
  }
  return value;
}

/**
 * Converts a raw ArrayBuffer (the SHA-256 output) into a hex string.
 * Example: <ArrayBuffer: [0xde, 0xad]> → "dead"
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Computes a stable SHA-256 hex digest from the user's profile snapshot.
 *
 * Returns a 64-character hex string. Async because Web Crypto's digest()
 * is always async (by spec), even though it's CPU-bound.
 *
 * Safe to call server-side (Node.js) or client-side (browser) — same API
 * is available in both environments.
 *
 * @example
 *   const hash = await computeProfileHash({ values, interests, life_categories });
 *   // → "a3f2c1..." (64 hex chars)
 */
export async function computeProfileHash(snapshot: ProfileSnapshot): Promise<string> {
  // Serialize with sorted keys for a deterministic string.
  const serialized = JSON.stringify(snapshot, sortedReplacer);

  // Encode as UTF-8 bytes for the crypto API.
  const encoded = new TextEncoder().encode(serialized);

  // SHA-256 digest — returns an ArrayBuffer.
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);

  return bufferToHex(hashBuffer);
}
