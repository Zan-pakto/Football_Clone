import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router = Router();

// Try to write to my-app/public/cache/logos so Next.js static asset serving also benefits,
// otherwise fall back to backend/cache/logos
const PRIMARY_CACHE_DIR = path.resolve(__dirname, "../../../my-app/public/cache/logos");
const FALLBACK_CACHE_DIR = path.resolve(__dirname, "../../cache/logos");

function getCacheDir(): string {
  if (fs.existsSync(path.resolve(__dirname, "../../../my-app/public"))) {
    if (!fs.existsSync(PRIMARY_CACHE_DIR)) {
      try {
        fs.mkdirSync(PRIMARY_CACHE_DIR, { recursive: true });
      } catch {}
    }
    return PRIMARY_CACHE_DIR;
  }
  if (!fs.existsSync(FALLBACK_CACHE_DIR)) {
    try {
      fs.mkdirSync(FALLBACK_CACHE_DIR, { recursive: true });
    } catch {}
  }
  return FALLBACK_CACHE_DIR;
}

const memCache = new Map<string, { buffer: Buffer; contentType: string }>();

function getExtension(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const ext = path.extname(parsed.pathname).toLowerCase();
    if (ext && [".webp", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".ico"].includes(ext)) {
      return ext;
    }
  } catch {}
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

router.get("/", async (req: Request, res: Response) => {
  try {
    const targetUrl = (req.query.url as string) || "";
    if (!targetUrl || (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))) {
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(getFallbackSvg());
    }

    const trimmedUrl = targetUrl.trim();
    const ext = getExtension(trimmedUrl);
    const hash = crypto.createHash("md5").update(trimmedUrl).digest("hex");
    const filename = `${hash}${ext}`;
    const contentType = getContentType(ext);

    // 1. In-memory check
    if (memCache.has(hash)) {
      const cached = memCache.get(hash)!;
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("X-Cache", "MEM-HIT");
      return res.send(cached.buffer);
    }

    // 2. Disk check
    const cacheDir = getCacheDir();
    const filePath = path.join(cacheDir, filename);

    if (fs.existsSync(filePath)) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        memCache.set(hash, { buffer: fileBuffer, contentType });
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("X-Cache", "DISK-HIT");
        return res.send(fileBuffer);
      } catch (readErr) {
        console.warn("[Backend LogoCache] Read error:", readErr);
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
          console.warn("[Backend LogoCache] Disk write error:", writeErr);
        }

        // Cache in memory
        memCache.set(hash, { buffer, contentType: resolvedType });

        res.setHeader("Content-Type", resolvedType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("X-Cache", "MISS-CACHED");
        return res.send(buffer);
      }
    } catch (fetchErr) {
      console.warn(`[Backend LogoCache] Remote fetch failed for ${trimmedUrl}:`, fetchErr);
    }

    // 4. Fallback placeholder
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Cache", "FALLBACK");
    return res.send(getFallbackSvg());
  } catch (err: any) {
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(getFallbackSvg());
  }
});

export default router;
