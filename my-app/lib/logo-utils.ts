/**
 * Utility to convert raw / external logo URLs into our cached proxy endpoint.
 * Ensures the browser loads images from our local cache, fetching from external CDN once and caching indefinitely.
 */

export function toCachedLogoUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Local flags or already cached endpoint
  if (trimmed.startsWith("/flags/") || trimmed.startsWith("/api/logo-cache") || trimmed.startsWith("/cache/")) {
    return trimmed;
  }

  // Nerdytips relative image path
  if (trimmed.startsWith("/public/img/")) {
    const fullUrl = `https://cdn.nerdytips.com${trimmed}`;
    return `/api/logo-cache?url=${encodeURIComponent(fullUrl)}`;
  }

  // External URLs (e.g. cdn.nerdytips.com or other external CDNs)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    // If it's a localhost URL, leave as is
    if (trimmed.includes("localhost:") || trimmed.includes("127.0.0.1:")) {
      return trimmed;
    }
    return `/api/logo-cache?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

/**
 * Returns initials for a football team or league name
 */
export function getTeamInitials(name?: string | null): string {
  if (!name) return "FC";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}
