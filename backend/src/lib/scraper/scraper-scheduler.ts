import { nerdyTipsScraper } from "./nerdytips-scraper";
import { normalizeScrapedMatchToMatchData } from "./nerdytips-normalizer";
import { store } from "../db/store";
import { cacheService } from "../cache/cache-service";

export interface SyncStats {
  success: boolean;
  totalSynced: number;
  breakdown: Record<string, number>;
  timestamp: string;
  error?: string;
}

export class ScraperScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastSyncStats: SyncStats | null = null;

  get lastStats(): SyncStats | null {
    return this.lastSyncStats;
  }

  /**
   * Run synchronization for specified days (default: yesterday, today, tomorrow)
   */
  async sync(days: string[] = ["-1", "0", "1"], tz?: string | number | null): Promise<SyncStats> {
    if (this.isRunning) {
      console.log("[ScraperScheduler] Sync already in progress, skipping duplicate trigger.");
      return (
        this.lastSyncStats || {
          success: false,
          totalSynced: 0,
          breakdown: {},
          timestamp: new Date().toISOString(),
          error: "Sync already in progress",
        }
      );
    }

    this.isRunning = true;
    const startTime = Date.now();
    let total = 0;
    const breakdown: Record<string, number> = {};

    try {
      const activeTz = tz || process.env.TIMEZONE_OFFSET || "330";
      console.log(`[ScraperScheduler] Initiating sync for days: [${days.join(", ")}] (tz=${activeTz})...`);
      const cycleResults = await nerdyTipsScraper.runAuthenticatedCycle(days, activeTz);

      for (const [d, matches] of Object.entries(cycleResults)) {
        if (matches.length > 0) {
          const normalized = matches.map(normalizeScrapedMatchToMatchData);
          await store.saveMatches(normalized, d);
          breakdown[d] = normalized.length;
          total += normalized.length;

          // Invalidate cache for this date so frontend re-loads latest matches immediately
          await cacheService.invalidatePattern(`fixtures_*:${d}:*`);
          await cacheService.invalidatePattern(`fixtures_grouped:${d}:*`);
        } else {
          breakdown[d] = 0;
        }
      }

      // Also invalidate track record cache so recent settlements display in /progress
      await cacheService.invalidate("track_record_progress");

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[ScraperScheduler] Successfully synced ${total} matches across ${days.length} days in ${elapsed}s.`);

      this.lastSyncStats = {
        success: true,
        totalSynced: total,
        breakdown,
        timestamp: new Date().toISOString(),
      };

      return this.lastSyncStats;
    } catch (err: any) {
      console.error("[ScraperScheduler] Sync failed with error:", err.message);
      this.lastSyncStats = {
        success: false,
        totalSynced: total,
        breakdown,
        timestamp: new Date().toISOString(),
        error: err.message,
      };
      return this.lastSyncStats;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start 12-hour background scheduler
   */
  start(intervalMs: number = 12 * 60 * 60 * 1000): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log(`[ScraperScheduler] Scheduled automatic sync every ${Math.round(intervalMs / 3600000)} hours.`);

    // Run initial sync: prioritize today (d=0) immediately, then tomorrow and yesterday
    setTimeout(() => {
      this.sync(["0"])
        .then(() => {
          setTimeout(() => {
            this.sync(["1", "-1"]).catch((e) =>
              console.warn("[ScraperScheduler] Secondary sync error:", e.message)
            );
          }, 3000);
        })
        .catch((e) =>
          console.warn("[ScraperScheduler] Initial sync error:", e.message)
        );
    }, 2000);

    // Run recurring 12-hour cycle
    this.timer = setInterval(() => {
      console.log("[ScraperScheduler] Running scheduled 12-hour sync cycle...");
      this.sync(["-1", "0", "1"]).catch((e) =>
        console.warn("[ScraperScheduler] Scheduled cycle error:", e.message)
      );
    }, intervalMs);
  }

  /**
   * Stop background scheduler
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[ScraperScheduler] Stopped background scheduler.");
    }
  }
}

export const scraperScheduler = new ScraperScheduler();
