/**
 * AI Variance Engine
 * 
 * Introduces subtle, deterministic pseudo-random variations to scraped AI prediction data
 * (odds, trust ratings, confidence percentages) so JollofTips has unique, independent AI metrics
 * while preserving 100% of the underlying winning selections and banker value.
 *
 * Uses deterministic hashing keyed by fixtureId so the numbers remain 100% consistent across
 * page reloads and between different users.
 */

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededFloat(seedStr: string): number {
  return (hashString(seedStr) % 10000) / 10000;
}

/**
 * Checks if variation is enabled (defaults to true)
 */
export function isVariationEnabled(): boolean {
  return process.env.AI_VARIATION_ENABLED !== "false";
}

/**
 * Adjust odds slightly (e.g. 1.85 -> 1.82 or 1.88)
 * Default maxOffset is 0.07. Guaranteed not to drop below 1.05.
 */
export function adjustOdd(
  odd: number | null | undefined,
  seedKey: string,
  maxOffset = 0.07
): number | null {
  if (odd === null || odd === undefined || isNaN(odd) || odd <= 0) return null;
  if (!isVariationEnabled()) return Math.round(odd * 100) / 100;

  const f = seededFloat(seedKey);
  const rawOffset = f * (maxOffset * 2) - maxOffset;
  // Snap offset to increments of ~0.01
  const offset = Math.round(rawOffset * 100) / 100;
  const adjusted = Math.max(1.05, Math.round((odd + offset) * 100) / 100);
  return adjusted;
}

/**
 * String wrapper for adjustOdd
 */
export function adjustOddStr(
  oddStr: string | null | undefined,
  seedKey: string,
  maxOffset = 0.07
): string | null {
  if (!oddStr) return null;
  const num = parseFloat(oddStr);
  if (isNaN(num)) return oddStr;
  const adjusted = adjustOdd(num, seedKey, maxOffset);
  return adjusted !== null ? adjusted.toFixed(2) : null;
}

/**
 * Adjust confidence percentage by a small delta (e.g. 78% -> 76% or 80%)
 * Default maxShift is 2% (clamped between 35% and 96%)
 */
export function adjustConfidence(
  confidence: number | null | undefined,
  seedKey: string,
  maxShift = 2
): number | null {
  if (confidence === null || confidence === undefined || isNaN(confidence)) return null;
  if (!isVariationEnabled()) return confidence;

  const f = seededFloat(seedKey);
  const offset = Math.round(f * (maxShift * 2) - maxShift);
  return Math.min(96, Math.max(35, confidence + offset));
}

/**
 * Adjust 0-10 rating slightly (e.g. 8.4 -> 8.2 or 8.5)
 * Default maxShift is 0.2 (clamped between 4.0 and 9.7)
 */
export function adjustRating(
  rating: number | null | undefined,
  seedKey: string,
  maxShift = 0.2
): number | null {
  if (rating === null || rating === undefined || isNaN(rating)) return null;
  if (!isVariationEnabled()) return rating;

  const f = seededFloat(seedKey);
  const rawOffset = f * (maxShift * 2) - maxShift;
  const offset = Math.round(rawOffset * 10) / 10;
  return Math.min(9.7, Math.max(4.0, Math.round((rating + offset) * 10) / 10));
}
