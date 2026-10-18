/**
 * Safely decode HTML entities (e.g. &#039; -> ', &amp; -> &, &quot; -> ", etc.)
 */
export function decodeHtmlEntities(str?: string | null): string {
  if (!str) return "";
  let decoded = String(str);
  for (let i = 0; i < 2; i++) {
    const prev = decoded;
    decoded = decoded
      .replace(/&#(\d+);/g, (_, dec) => {
        try {
          const code = parseInt(dec, 10);
          return code > 0 ? String.fromCodePoint(code) : _;
        } catch {
          return _;
        }
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        try {
          const code = parseInt(hex, 16);
          return code > 0 ? String.fromCodePoint(code) : _;
        } catch {
          return _;
        }
      })
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&bull;/g, "•")
      .replace(/&middot;/g, "·")
      .replace(/&copy;/g, "©")
      .replace(/&trade;/g, "™")
      .replace(/&reg;/g, "®");
    if (prev === decoded) break;
  }
  return decoded.trim();
}

/**
 * Clean text value (remove arrows, symbols, extra whitespace, decode HTML entities)
 */
export function cleanValue(val: string | undefined | null): string | null {
  if (!val) return null;
  const decoded = decodeHtmlEntities(val);
  const cleaned = decoded.replace(/[▴▾✓\n\r\t]/g, "").trim();
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

/**
 * Format a match kickoff time for the visitor's local device timezone.
 * Handles UTC ISO strings ("2026-10-18T13:00:00.000Z"), HH:mm times, and date strings.
 */
export function formatMatchKickoff(
  kickTime?: string | null,
  kickoffUtc?: string | null,
  matchDate?: string | null
): string {
  if (kickoffUtc) {
    try {
      const d = new Date(kickoffUtc);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      }
    } catch {
      // fallback
    }
  }

  if (kickTime && /^\d{1,2}:\d{2}$/.test(kickTime)) {
    try {
      const dStr = matchDate || new Date().toISOString().split("T")[0];
      const [hh, mm] = kickTime.split(":");
      const d = new Date(`${dStr}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00.000Z`);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      }
    } catch {
      // fallback
    }
    return kickTime;
  }

  return kickTime || "--:--";
}

/**
 * Format kickoff time into stacked hour (top) and minute (bottom) in visitor's local timezone
 */
export function formatStackedKickoff(
  kickTime?: string | null,
  kickoffUtc?: string | null,
  matchDate?: string | null
): { top: string; bottom: string } {
  const formatted = formatMatchKickoff(kickTime, kickoffUtc, matchDate);
  if (formatted.includes(":")) {
    const [hh, mm] = formatted.split(":");
    return { top: hh, bottom: mm };
  }
  return { top: formatted, bottom: "" };
}

