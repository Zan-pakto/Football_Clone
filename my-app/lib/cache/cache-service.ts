import { revalidatePath, revalidateTag } from "next/cache";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export const CACHE_TTL = {
  LIVE_SCORES: 60, // 60-90s for live matches
  FIXTURES: 3600, // 1 hour for daily fixture schedules
  ODDS: 7200, // 2 hours
  STATS: 86400, // 24 hours
  INJURIES: 14400, // 4 hours
  LINEUPS: 1800, // 30 minutes
  PREDICTIONS: 18000, // 5 hours or until kickoff
};

export class CacheService {
  private memoryStore = new Map<string, CacheEntry<any>>();

  /**
   * Retrieve cached value if unexpired
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set key with TTL in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryStore.set(key, { value, expiresAt });
  }

  /**
   * Delete specific cache key
   */
  async delete(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  /**
   * Invalidate specific key
   */
  async invalidate(key: string): Promise<void> {
    await this.delete(key);
  }

  /**
   * Invalidate all keys matching prefix/regex pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    for (const key of this.memoryStore.keys()) {
      if (regex.test(key)) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Revalidate Next.js cache path
   */
  revalidateNextPath(path: string): void {
    try {
      revalidatePath(path);
    } catch {
      // Ignore when called outside of Next.js server runtime context
    }
  }

  /**
   * Revalidate Next.js cache tag
   */
  revalidateNextTag(tag: string): void {
    try {
      (revalidateTag as any)(tag);
    } catch {
      // Ignore when called outside of Next.js server runtime context
    }
  }

  /**
   * Clear all memory cache
   */
  async clearAll(): Promise<void> {
    this.memoryStore.clear();
  }
}

export const cacheService = new CacheService();
