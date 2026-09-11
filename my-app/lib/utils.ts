/**
 * Clean text value (remove arrows, symbols, extra whitespace)
 */
export function cleanValue(val: string | undefined | null): string | null {
  if (!val) return null;
  const cleaned = val.replace(/[▴▾✓\n\r\t]/g, "").trim();
  if (!cleaned || /^[\.\-\*\s•\u2022]+$/.test(cleaned) || cleaned === "..." || cleaned === "•••") return null;
  return cleaned;
}

/**
 * Determine accurately if a match is live in-progress (not terminal, not upcoming)
 */
export function isMatchLive(status: string | null | undefined, elapsed: string | null | undefined): boolean {
  if (!status && !elapsed) return false;
  const s = (status || "").trim();
  const e = (elapsed || "").trim();

  // Terminal check: finished, won, lost, FT, AET, Pen, canceled, postponed, ended
  if (/\b(fin|finished|won|lost|FT|AET|Pen|cancel|canceled|postpone|postponed|ended)\b/i.test(s)) return false;
  if (/^(FT|AET|Pen|90\+|120|120\+)/i.test(e)) return false;

  // Upcoming check
  if (s.toLowerCase() === "upcoming") return false;
  if (/^\d{1,2}:\d{2}$/.test(e)) return false;

  // Live match indicators
  if (/live|in progress|half|1st|2nd|ht|\d+['′]/i.test(s)) return true;
  if (/live|in progress|half|1st|2nd|ht|\d+['′]/i.test(e)) return true;

  return s.toLowerCase() === "live" || s.toLowerCase() === "in progress";
}

/**
 * Resolve day offset or YYYY-MM-DD date string using UTC internal boundary
 */
export function resolveDateString(d: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return d;
  }
  const offset = parseInt(d, 10);
  if (!isNaN(offset)) {
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
    return utcDate.toISOString().split("T")[0];
  }
  return d;
}

/**
 * Get internal standardized UTC Date String (YYYY-MM-DD)
 */
export function getUtcTodayString(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().split("T")[0];
}

/**
 * Convert UTC timestamp to visitor's local formatted time string
 */
export function formatToLocalTime(utcIsoString: string, timeZone?: string): string {
  try {
    const d = new Date(utcIsoString);
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timeZone || undefined,
    }).format(d);
  } catch {
    return utcIsoString;
  }
}

