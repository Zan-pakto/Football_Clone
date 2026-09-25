import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Ensure local cache directory exists in public/cache/logos
const CACHE_DIR = path.join(process.cwd(), "public", "cache", "logos");

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// In-memory buffer cache for ultra-low latency (<1ms)
const memCache = new Map<string, { buffer: Buffer; contentType: string }>();

function getExtension(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const pathname = parsed.pathname;
    const ext = path.extname(pathname).toLowerCase();
    if (ext && [".webp", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".ico"].includes(ext)) {
      return ext;
    }
  } catch {
    // fallback
  }
  return ".webp";
}

function getContentType(ext: string): string {
  switch (ext) {
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".ico":
      return "image/x-icon";
    case ".webp":
    default:
      return "image/webp";
  }
}

function getFallbackSvg(label: string = "FC"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <circle cx="24" cy="24" r="22" fill="#1b183d" stroke="rgba(167, 159, 255, 0.3)" stroke-width="2"/>
  <text x="24" y="28" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="800" fill="#a79fff" text-anchor="middle">${label.slice(0, 3)}</text>
</svg>`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new NextResponse(getFallbackSvg(), {
        headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
      });
    }

    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return new NextResponse(getFallbackSvg(), {
        headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
      });
    }

    const ext = getExtension(trimmedUrl);
    const hash = crypto.createHash("md5").update(trimmedUrl).digest("hex");
    const filename = `${hash}${ext}`;
    const contentType = getContentType(ext);

    // 1. Check in-memory cache
    if (memCache.has(hash)) {
      const cached = memCache.get(hash)!;
      return new NextResponse(new Uint8Array(cached.buffer), {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Cache": "MEM-HIT",
        },
      });
    }

    // 2. Check disk cache
    ensureCacheDir();
    const filePath = path.join(CACHE_DIR, filename);

    if (fs.existsSync(filePath)) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        memCache.set(hash, { buffer: fileBuffer, contentType });
        return new NextResponse(new Uint8Array(fileBuffer), {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Cache": "DISK-HIT",
          },
        });
      } catch (err) {
        console.warn("[LogoCache] Error reading cached file:", err);
      }
    }

    // 3. Fetch from remote origin ONCE, then save to disk & memory
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(trimmedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const resolvedType = response.headers.get("content-type") || contentType;

        // Persist to disk
        try {
          fs.writeFileSync(filePath, buffer);
        } catch (writeErr) {
          console.warn("[LogoCache] Failed to write cache file:", writeErr);
        }

        // Cache in memory
        memCache.set(hash, { buffer, contentType: resolvedType });

        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": resolvedType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Cache": "MISS-CACHED",
          },
        });
      }
    } catch (fetchErr) {
      console.warn(`[LogoCache] Remote fetch failed for ${trimmedUrl}:`, fetchErr);
    }

    // 4. Fallback placeholder if remote fails
    return new NextResponse(getFallbackSvg(), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
        "X-Cache": "FALLBACK",
      },
    });
  } catch (err: any) {
    return new NextResponse(getFallbackSvg(), {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    });
  }
}
