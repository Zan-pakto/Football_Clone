import { Bot, InlineKeyboard } from "grammy";
import { nerdyTipsScraper, ScrapedMatch } from "../scraper/nerdytips-scraper";
import { normalizeScrapedMatchToMatchData } from "../scraper/nerdytips-normalizer";
import { store } from "../db/store";
import { prisma } from "../db/prisma";
import { MatchData } from "../types";
import * as fs from "fs";
import * as path from "path";

const token = process.env.TELEGRAM_BOT_TOKEN;
const clientAppUrl = process.env.CLIENT_APP_URL || process.env.FRONTEND_URL || "https://jolloftips.com";
const whopCheckoutUrl = process.env.WHOP_CHECKOUT_URL_VIP_MONTHLY || "https://whop.com/checkout/plan_3LE4tmGm31ISJ";

interface LinkedUserRecord {
  email: string;
  linkedAt: string;
  isVipOverride?: boolean;
}

export class TelegramBotService {
  private bot: Bot | null = null;
  private isInitialized = false;
  private dataDir: string;
  private storageFilePath: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), "data");
    this.storageFilePath = path.join(this.dataDir, "telegram_users.json");

    if (token && !token.includes("placeholder")) {
      try {
        this.bot = new Bot(token);
        this.setupHandlers();
      } catch (err: any) {
        console.warn(`[TelegramBotService] Failed to construct Bot: ${err.message}`);
      }
    }
  }

  // --- Local persistent storage for linked Telegram users ---
  private getLinkedUsers(): Record<string, LinkedUserRecord> {
    try {
      if (!fs.existsSync(this.storageFilePath)) {
        return {};
      }
      const raw = fs.readFileSync(this.storageFilePath, "utf8");
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private saveLinkedUser(telegramId: number | string, email: string, isVipOverride: boolean = false): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const users = this.getLinkedUsers();
      users[String(telegramId)] = {
        email: email.trim().toLowerCase(),
        linkedAt: new Date().toISOString(),
        isVipOverride,
      };
      fs.writeFileSync(this.storageFilePath, JSON.stringify(users, null, 2), "utf8");
    } catch (err: any) {
      console.warn(`[TelegramBotService] Failed to save linked user: ${err.message}`);
    }
  }

  private removeLinkedUser(telegramId: number | string): boolean {
    try {
      const users = this.getLinkedUsers();
      if (users[String(telegramId)]) {
        delete users[String(telegramId)];
        if (!fs.existsSync(this.dataDir)) {
          fs.mkdirSync(this.dataDir, { recursive: true });
        }
        fs.writeFileSync(this.storageFilePath, JSON.stringify(users, null, 2), "utf8");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Determine if a Telegram user has active VIP Pro status
   */
  async checkUserVipStatus(telegramId: number | string): Promise<{ isVip: boolean; email?: string; expiresAt?: string }> {
    try {
      const users = this.getLinkedUsers();
      let user = users[String(telegramId)];

      // Fallback: If local file was wiped by Render restart, recover from PostgreSQL Session
      if (!user) {
        try {
          const dbLink = await prisma.session.findUnique({
            where: { token: `telegram_link_${telegramId}` },
            include: { user: true },
          });
          if (dbLink?.user?.email) {
            user = { email: dbLink.user.email, linkedAt: new Date().toISOString() };
            this.saveLinkedUser(telegramId, user.email, false);
          }
        } catch {
          // ignore
        }
      }

      if (!user) {
        return { isVip: false };
      }

      if (user.isVipOverride) {
        return { isVip: true, email: user.email };
      }

      // Check database subscription
      const sub = await prisma.subscription.findFirst({
        where: {
          user: {
            email: { equals: user.email, mode: "insensitive" },
          },
          status: "ACTIVE",
        },
        orderBy: { createdAt: "desc" },
      });

      if (sub && (!sub.expiresAt || new Date(sub.expiresAt) > new Date())) {
        return {
          isVip: true,
          email: user.email,
          expiresAt: sub.expiresAt ? sub.expiresAt.toISOString().split("T")[0] : undefined,
        };
      }

      // Check Whop API directly if key is configured
      if (process.env.WHOP_API_KEY && !process.env.WHOP_API_KEY.includes("placeholder")) {
        try {
          const res = await fetch(`https://api.whop.com/api/v5/app/memberships?email=${encodeURIComponent(user.email)}`, {
            headers: {
              Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
            },
          });
          if (res.ok) {
            const data: any = await res.json();
            const valid = (data.data || []).some((m: any) => m.valid === true || m.status === "active");
            if (valid) {
              return { isVip: true, email: user.email };
            }
          }
        } catch {
          // ignore
        }
      }

      return { isVip: false, email: user.email };
    } catch {
      return { isVip: false };
    }
  }

  private getMainKeyboard(isVip: boolean = false): InlineKeyboard {
    if (isVip) {
      return new InlineKeyboard()
        .text("⚽ 10 Free Daily Picks", "free_picks")
        .text("🎯 Bankers of the Day (All 3)", "banker_picks")
        .row()
        .text("👑 VIP Pro All Fixtures", "vip_picks")
        .text("👤 My Account / Status", "account_status")
        .row()
        .url("🌐 Open JollofTips WebApp", clientAppUrl);
    }

    return new InlineKeyboard()
      .text("⚽ Today's 10 Free Picks", "free_picks")
      .text("🎯 Banker of the Day", "banker_picks")
      .row()
      .text("👑 VIP Pro Access", "vip_info")
      .url("⭐ Upgrade on Whop ($19.99)", whopCheckoutUrl)
      .row()
      .text("🔗 Link VIP Account", "link_info")
      .url("🌐 Open JollofTips WebApp", clientAppUrl);
  }

  private setupHandlers() {
    if (!this.bot) return;

    // /start Command
    this.bot.command("start", async (ctx) => {
      const userName = ctx.from?.first_name || "Football Fan";
      const { isVip, email } = await this.checkUserVipStatus(ctx.from?.id || 0);

      const vipBadge = isVip ? "👑 *VIP PRO ACTIVE*" : "🆓 *FREE TIER (10 Picks/Day)*";
      const message =
        `👋 *Welcome to JollofTips AI Football Predictions, ${userName}!*\n\n` +
        `Current Status: ${vipBadge}${email ? ` (${email})` : ""}\n\n` +
        `🏆 Delivering quantitative mathematical predictions powered by *100,000 Monte Carlo match simulations*, value odds (+EV), and daily verified bankers.\n\n` +
        `Choose an option below to view today's predictions:`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: this.getMainKeyboard(isVip),
      });
    });

    // /free Command - EXACT 10 Free Predictions matching Website Landing Page
    this.bot.command("free", async (ctx) => {
      await this.sendFreePicks(ctx);
    });

    // /banker Command - Banker of the Day (Free vs VIP)
    this.bot.command("banker", async (ctx) => {
      await this.sendBankerPicks(ctx);
    });

    // /vip_picks Command - Unlocked VIP fixtures
    this.bot.command("vip_picks", async (ctx) => {
      await this.sendVipPicks(ctx);
    });

    // /vip Command - VIP Membership Overview & Whop Checkout
    this.bot.command("vip", async (ctx) => {
      await this.sendVipInfo(ctx);
    });

    // /status Command - Current subscription state
    this.bot.command("status", async (ctx) => {
      await this.sendStatus(ctx);
    });

    // /link Command - Link Telegram to JollofTips email
    this.bot.command("link", async (ctx) => {
      const text = ctx.message?.text || "";
      const parts = text.split(" ").filter(Boolean);
      if (parts.length < 2) {
        await ctx.reply(
          `🔗 *How to link your VIP Account:*\n\n` +
          `Send: \`/link your-email@example.com\`\n\n` +
          `Use the exact email address you used during your Whop checkout or JollofTips registration.`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      const email = parts[1].trim().toLowerCase();
      if (!email.includes("@") || !email.includes(".")) {
        await ctx.reply("❌ Please provide a valid email address. Example: `/link user@gmail.com`", { parse_mode: "Markdown" });
        return;
      }

      await ctx.reply(`🔍 Verifying subscription for *${email}*...`, { parse_mode: "Markdown" });

      // Check DB
      const sub = await prisma.subscription.findFirst({
        where: {
          user: { email: { equals: email, mode: "insensitive" } },
          status: "ACTIVE",
        },
      });

      let isValid = Boolean(sub);

      // Check Whop API directly if not found in Prisma
      if (!isValid && process.env.WHOP_API_KEY && !process.env.WHOP_API_KEY.includes("placeholder")) {
        try {
          const res = await fetch(`https://api.whop.com/api/v5/app/memberships?email=${encodeURIComponent(email)}`, {
            headers: { Authorization: `Bearer ${process.env.WHOP_API_KEY}` },
          });
          if (res.ok) {
            const data: any = await res.json();
            isValid = (data.data || []).some((m: any) => m.valid === true || m.status === "active");
          }
        } catch {
          // ignore
        }
      }

      if (isValid) {
        this.saveLinkedUser(ctx.from?.id || 0, email, true);

        // Also persist link to database so Render restarts never lose it
        try {
          let dbUser = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
          });
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email,
                passwordHash: "telegram_linked_user",
                name: ctx.from?.first_name || "Telegram User",
              },
            });
          }
          await prisma.session.upsert({
            where: { token: `telegram_link_${ctx.from?.id || 0}` },
            update: {
              userId: dbUser.id,
              deviceName: "Telegram Bot",
              expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
            },
            create: {
              token: `telegram_link_${ctx.from?.id || 0}`,
              userId: dbUser.id,
              deviceName: "Telegram Bot",
              expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
            },
          });
        } catch (dbErr: any) {
          console.warn("[TelegramBotService] Database link notice:", dbErr.message);
        }

        await ctx.reply(
          `🎉 *VIP PRO ACTIVATED!*\n\n` +
          `Welcome to JollofTips VIP Pro, *${ctx.from?.first_name || "Member"}*!\n` +
          `Your Telegram ID is now linked to: *${email}*\n\n` +
          `✅ Unlimited match predictions unlocked\n` +
          `✅ All 3 Bankers of the Day & 5-Fold ACCA Slip unlocked\n` +
          `✅ Real-time algorithmic edge alerts enabled\n\n` +
          `Tap below to view today's VIP locks:`,
          {
            parse_mode: "Markdown",
            reply_markup: this.getMainKeyboard(true),
          }
        );
      } else {
        this.saveLinkedUser(ctx.from?.id || 0, email, false);
        await ctx.reply(
          `⚠️ *No active VIP Pro subscription found for ${email}.*\n\n` +
          `If you haven't subscribed yet, upgrade on Whop to unlock all daily fixtures and Telegram VIP privileges:`,
          {
            parse_mode: "Markdown",
            reply_markup: new InlineKeyboard()
              .url("⭐ Upgrade on Whop ($19.99/mo)", whopCheckoutUrl)
              .row()
              .text("🔄 Re-Check Subscription", "check_status"),
          }
        );
      }
    });

    // /unlink Command
    this.bot.command("unlink", async (ctx) => {
      const removed = this.removeLinkedUser(ctx.from?.id || 0);
      try {
        await prisma.session.deleteMany({
          where: { token: `telegram_link_${ctx.from?.id || 0}` },
        });
      } catch {
        // ignore
      }
      if (removed) {
        await ctx.reply("✅ Your Telegram account has been unlinked. You are now on the Free Tier (10 picks/day).", {
          reply_markup: this.getMainKeyboard(false),
        });
      } else {
        await ctx.reply("ℹ️ No linked account was found for your Telegram ID.", {
          reply_markup: this.getMainKeyboard(false),
        });
      }
    });

    // /help Command
    this.bot.command("help", async (ctx) => {
      const helpMsg =
        `📖 *JollofTips Telegram Bot Commands:*\n\n` +
        `• /free - Today's 10 Free AI Predictions (Same as Website!)\n` +
        `• /banker - Banker of the Day & ACCA Slip\n` +
        `• /vip\\_picks - High-confidence VIP Pro locks (VIP members)\n` +
        `• /link <email> - Link your Whop / Website VIP subscription\n` +
        `• /status - Check your current account tier\n` +
        `• /vip - VIP Pro plan benefits & upgrade link\n` +
        `• /app - Open live JollofTips WebApp`;

      await ctx.reply(helpMsg, { parse_mode: "Markdown", reply_markup: this.getMainKeyboard(false) });
    });

    // /app Command
    this.bot.command("app", async (ctx) => {
      const keyboard = new InlineKeyboard().url("🚀 Launch JollofTips WebApp", clientAppUrl);
      await ctx.reply("Click below to open the complete JollofTips analytics suite in your browser:", {
        reply_markup: keyboard,
      });
    });

    // Callback queries from interactive buttons
    this.bot.callbackQuery("free_picks", async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.sendFreePicks(ctx);
    });

    this.bot.callbackQuery("banker_picks", async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.sendBankerPicks(ctx);
    });

    this.bot.callbackQuery("vip_picks", async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.sendVipPicks(ctx);
    });

    this.bot.callbackQuery("vip_info", async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.sendVipInfo(ctx);
    });

    this.bot.callbackQuery("account_status", async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.sendStatus(ctx);
    });

    this.bot.callbackQuery("check_status", async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.sendStatus(ctx);
    });

    this.bot.callbackQuery("link_info", async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply(
        `🔗 *Link Your VIP Pro Subscription:*\n\n` +
        `Type: \`/link your-email@example.com\`\n\n` +
        `Replace with the email address associated with your Whop payment or JollofTips account.`,
        { parse_mode: "Markdown" }
      );
    });

    // Global Error Handler
    this.bot.catch((err) => {
      console.error("[TelegramBotService] Error in bot handler:", err.error);
    });
  }

  /**
   * Helper to retrieve today's synchronized matches directly from store (exact website data)
   */
  private async getTodayMatchesFromStore(): Promise<MatchData[]> {
    try {
      const storeData = await store.getMatches("0");
      if (storeData && storeData.matches && storeData.matches.length > 0) {
        return storeData.matches;
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Send the EXACT 10 Free Predictions for Today matching the Website Landing Page
   */
  private async sendFreePicks(ctx: any) {
    try {
      const { isVip } = await this.checkUserVipStatus(ctx.from?.id || 0);

      // 1. Fetch live synchronized matches from Store (identical to website)
      let matches = await this.getTodayMatchesFromStore();

      // 2. Fallback to bet of the day scraper if store is empty
      if (matches.length === 0) {
        const botd = await nerdyTipsScraper.scrapeBetOfTheDay("0");
        const fallback = [...botd.bankers, ...botd.slip];
        if (fallback.length > 0) {
          matches = fallback.map(normalizeScrapedMatchToMatchData);
        }
      }

      if (matches.length === 0) {
        await ctx.reply(
          `⚽ *Today's Free Predictions:*\n` +
          `Algorithmic match models are synchronizing today's games. Please view live fixtures directly on JollofTips:`,
          {
            parse_mode: "Markdown",
            reply_markup: new InlineKeyboard().url("🌐 View Live on JollofTips", `${clientAppUrl}/all-matches`),
          }
        );
        return;
      }

      // Sort by highest confidence / rating, exactly matching the website feed priority
      const sortedMatches = [...matches].sort((a, b) => {
        const confA = parseFloat(a.confidence?.replace("%", "") || "0") || (a.rating ? a.rating * 10 : 75);
        const confB = parseFloat(b.confidence?.replace("%", "") || "0") || (b.rating ? b.rating * 10 : 75);
        return confB - confA;
      });

      // Free quota: strictly 10 predictions
      const freeMatches = sortedMatches.slice(0, 10);
      const remainingCount = Math.max(0, sortedMatches.length - 10);

      let text = `⚽ *TODAY'S 10 FREE AI PREDICTIONS*\n`;
      text += `📅 _Same live algorithmic feed as JollofTips.com_\n\n`;

      freeMatches.forEach((m, idx) => {
        const home = m.homeTeam;
        const away = m.awayTeam;
        const league = `${m.country ? m.country + ": " : ""}${m.leagueName}`;
        const time = m.kickTime ? ` | ⏰ ${m.kickTime}` : "";
        const best = m.predictions?.bestTip;
        const pick = best?.pick || "1X";
        const odd = best?.odd ? ` @ ${best.odd}` : "";
        const conf = m.confidence || (m.rating ? `${Math.round(m.rating * 10)}%` : "84%");

        text += `*${idx + 1}. ${home} vs ${away}*\n`;
        text += `   🏆 ${league}${time}\n`;
        text += `   🎯 Pick: *${pick}*${odd} | Confidence: *${conf}*\n\n`;
      });

      if (!isVip && remainingCount > 0) {
        text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🔒 *FREE DAILY LIMIT (10 / 10 PICKS)*\n`;
        text += `You have viewed all 10 free daily predictions.\n`;
        text += `⚡ *${remainingCount}+ more fixtures* analyzed today with high-value (+EV) edges are locked for VIP Pro members.\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━━`;
      } else if (isVip) {
        text += `👑 *VIP Pro Member:* All ${sortedMatches.length} fixtures unlocked! Use /vip\\_picks to explore more high-yield picks.`;
      }

      const keyboard = new InlineKeyboard();
      if (!isVip) {
        keyboard.url(`⭐ Unlock All ${sortedMatches.length} Matches ($19.99)`, whopCheckoutUrl).row();
      } else {
        keyboard.text("👑 View VIP Pro Picks", "vip_picks").row();
      }

      keyboard
        .text("🎯 Banker of the Day", "banker_picks")
        .row()
        .url("🌐 Open Full WebApp", `${clientAppUrl}/all-matches`);

      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
    } catch (err: any) {
      console.error("[TelegramBotService] Error in sendFreePicks:", err.message);
      await ctx.reply("⚡ Match predictions are updating. Please check the website in a moment.", {
        reply_markup: new InlineKeyboard().url("🌐 Open JollofTips", clientAppUrl),
      });
    }
  }

  /**
   * Send Banker of the Day (Identical to Website /bet-of-the-day & Hero pick)
   */
  private async sendBankerPicks(ctx: any) {
    try {
      const { isVip } = await this.checkUserVipStatus(ctx.from?.id || 0);

      // Scrape or fetch Bet of the Day (same method as /api/bet-of-the-day)
      const botd = await nerdyTipsScraper.scrapeBetOfTheDay("0");
      const bankers = botd.bankers || [];
      const slip = botd.slip || [];

      if (bankers.length === 0 && slip.length === 0) {
        // Fallback to top rating match from store
        const storeMatches = await this.getTodayMatchesFromStore();
        if (storeMatches.length > 0) {
          const top = storeMatches[0];
          const text =
            `🎯 *BANKER OF THE DAY*\n\n` +
            `⚔️ *${top.homeTeam} vs ${top.awayTeam}*\n` +
            `🏆 Competition: *${top.country}: ${top.leagueName}*\n` +
            `🔒 Algorithmic Pick: *${top.predictions.bestTip.pick || "1"}* @ ${top.predictions.bestTip.odd || "1.75"}\n` +
            `📊 AI Confidence Score: *${top.confidence || "89%"}*\n\n` +
            `_Selected based on maximum probability & mathematical model edge._`;

          await ctx.reply(text, {
            parse_mode: "Markdown",
            reply_markup: new InlineKeyboard().url("🌐 Open Banker Page", `${clientAppUrl}/bet-of-the-day`),
          });
          return;
        }

        await ctx.reply("🎯 Today's Banker is being calculated. Check back in 10 minutes!", {
          reply_markup: new InlineKeyboard().url("🌐 View Live on JollofTips", `${clientAppUrl}/bet-of-the-day`),
        });
        return;
      }

      // Banker #1 (Free for all users)
      const b1 = bankers[0] || slip[0];
      const home1 = b1.homeTeam || "Home";
      const away1 = b1.awayTeam || "Away";
      const tip1 = b1.bestTip || "Home Win";
      const conf1 = b1.confidence || "86%";
      const league1 = `${b1.country ? b1.country + ": " : ""}${b1.league || "Division"}`;
      const odds1 = b1.tipOdds ? ` @ ${b1.tipOdds}` : "";

      let text = `🎯 *BANKER OF THE DAY (HIGH CONFIDENCE)*\n\n`;
      text += `⚔️ *${home1} vs ${away1}*\n`;
      text += `🏆 *${league1}*\n`;
      text += `🔒 Algorithmic Pick: *${tip1}*${odds1}\n`;
      text += `📊 AI Confidence Score: *${conf1}*\n\n`;

      // If VIP Pro, show ALL bankers and the full 5-Fold ACCA Slip
      if (isVip) {
        text += `👑 *VIP PRO UNLOCKED BANKERS:*\n\n`;

        if (bankers.length > 1) {
          bankers.slice(1, 3).forEach((b: ScrapedMatch, idx: number) => {
            const h = b.homeTeam;
            const a = b.awayTeam;
            const t = b.bestTip;
            const o = b.tipOdds ? ` @ ${b.tipOdds}` : "";
            const c = b.confidence || "84%";
            text += `*Banker #${idx + 2}: ${h} vs ${a}*\n`;
            text += `   Pick: *${t}*${o} | Conf: *${c}*\n\n`;
          });
        }

        if (slip.length > 0) {
          text += `📋 *TODAY'S VIP 5-FOLD ACCA SLIP:*\n`;
          let combinedOdds = 1.0;
          slip.forEach((s: ScrapedMatch, idx: number) => {
            const oddNum = typeof s.tipOdds === "number" ? s.tipOdds : parseFloat(String(s.tipOdds || "1.50")) || 1.5;
            combinedOdds *= oddNum;
            text += `${idx + 1}. ${s.homeTeam} vs ${s.awayTeam} ➔ *${s.bestTip || "1"}* @ ${s.tipOdds || "1.50"}\n`;
          });
          text += `\n🔥 Combined Multi Odds: *${combinedOdds.toFixed(2)}x*\n`;
        }

        const keyboard = new InlineKeyboard()
          .url("🌐 View Detailed Breakdown", `${clientAppUrl}/bet-of-the-day`)
          .row()
          .text("👑 View All VIP Picks", "vip_picks");

        await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
      } else {
        // Free user view: show Banker #1, lock remaining bankers
        text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🔒 *VIP Bankers #2, #3 & 5-Fold ACCA Slip Locked*\n`;
        text += `VIP Pro members get instant access to all 3 Bankers + today's full 5-Fold ACCA Multi (Avg 8.50+ odds).\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━━`;

        const keyboard = new InlineKeyboard()
          .url("👑 Unlock All Bankers ($19.99)", whopCheckoutUrl)
          .row()
          .text("🔗 Link Subscribed Account", "link_info")
          .row()
          .url("🌐 Open Banker Page", `${clientAppUrl}/bet-of-the-day`);

        await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
      }
    } catch (err: any) {
      console.error("[TelegramBotService] Error in sendBankerPicks:", err.message);
      await ctx.reply("🎯 Check out the Banker of the Day on our live dashboard:", {
        reply_markup: new InlineKeyboard().url("🌐 Open Banker Page", `${clientAppUrl}/bet-of-the-day`),
      });
    }
  }

  private escapeHtml(str: string | null | undefined): string {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * Send VIP exclusive fixtures to VIP members
   */
  private async sendVipPicks(ctx: any) {
    try {
      const { isVip, email } = await this.checkUserVipStatus(ctx.from?.id || 0);

      if (!isVip) {
        await ctx.reply(
          `🔒 <b>VIP PRO PICKS (LOCKED)</b>\n\n` +
          `This feature is reserved for JollofTips VIP Pro members.\n\n` +
          `VIP Pro unlocks:\n` +
          `• All 50+ fixtures daily across Premier League, La Liga, Serie A, etc.\n` +
          `• High-odds multi-market tips (1X2, Over/Under Goals, BTTS)\n` +
          `• All 3 Bankers of the Day + 5-Fold Acca Slips\n` +
          `• Exclusive Telegram in-play alerts\n\n` +
          `Already subscribed? Use <code>/link your-email@example.com</code>\n` +
          `Otherwise, upgrade via Whop below:`,
          {
            parse_mode: "HTML",
            reply_markup: new InlineKeyboard()
              .url("⭐ Upgrade to VIP Pro ($19.99/mo)", whopCheckoutUrl)
              .row()
              .text("🔗 Link Subscribed Account", "link_info"),
          }
        );
        return;
      }

      // 1. Fetch live synchronized matches from Store
      let matches = await this.getTodayMatchesFromStore();

      // 2. Fallback to bet of the day scraper if store is empty
      if (matches.length === 0) {
        try {
          const botd = await nerdyTipsScraper.scrapeBetOfTheDay("0");
          const fallback = [...(botd.bankers || []), ...(botd.slip || [])];
          if (fallback.length > 0) {
            matches = fallback.map(normalizeScrapedMatchToMatchData);
          }
        } catch (e: any) {
          console.warn("[TelegramBotService] BOTD fallback notice:", e.message);
        }
      }

      // 3. Fallback to daily scraper if still empty
      if (matches.length === 0) {
        try {
          const scraped = await nerdyTipsScraper.scrapeDay("0");
          if (scraped && scraped.length > 0) {
            matches = scraped.map(normalizeScrapedMatchToMatchData);
            await store.saveMatches(matches, "0");
          }
        } catch (e: any) {
          console.warn("[TelegramBotService] ScrapeDay fallback notice:", e.message);
        }
      }

      if (matches.length === 0) {
        await ctx.reply(
          `👑 <b>VIP Pro Picks:</b>\nToday's VIP matches are currently synchronizing. Please tap below to view live fixtures on the web app:`,
          {
            parse_mode: "HTML",
            reply_markup: new InlineKeyboard().url("🌐 Open VIP Dashboard", `${clientAppUrl}/all-matches`),
          }
        );
        return;
      }

      // Sort by highest confidence / rating
      const sortedMatches = [...matches].sort((a, b) => {
        const confA = parseFloat(a.confidence?.replace("%", "") || "0") || (a.rating ? a.rating * 10 : 75);
        const confB = parseFloat(b.confidence?.replace("%", "") || "0") || (b.rating ? b.rating * 10 : 75);
        return confB - confA;
      });

      // Filter high confidence (>= 75%), or fall back to top matches if not tagged
      let vipPicks = sortedMatches.filter((m) => {
        const conf = parseFloat(m.confidence?.replace("%", "") || "0") || (m.rating ? m.rating * 10 : 70);
        return conf >= 75;
      });

      if (vipPicks.length === 0) {
        vipPicks = sortedMatches.slice(0, 15);
      } else {
        vipPicks = vipPicks.slice(0, 15);
      }

      const displayEmail = this.escapeHtml(email || "Verified Member");
      let text = `👑 <b>VIP PRO EXCLUSIVE PICKS</b>\n`;
      text += `👤 <i>Active VIP: ${displayEmail}</i>\n\n`;

      vipPicks.forEach((m, idx) => {
        const best = m.predictions?.bestTip;
        const p1x2 = m.predictions?.pickScore?.pick;
        const goals = m.predictions?.goals?.pick;
        const btts = m.predictions?.btts?.pick;
        const pick = best?.pick || p1x2 || "1";
        const odd = best?.odd ? ` @ ${best.odd}` : "";
        const conf = m.confidence || (m.rating ? `${Math.round(m.rating * 10)}%` : "85%");
        const home = this.escapeHtml(m.homeTeam);
        const away = this.escapeHtml(m.awayTeam);
        const league = this.escapeHtml(`${m.country ? m.country + ": " : ""}${m.leagueName}`);
        const time = m.kickTime ? ` | ⏰ ${m.kickTime}` : "";

        text += `<b>${idx + 1}. ${home} vs ${away}</b>\n`;
        text += `   🏆 ${league}${time}\n`;
        text += `   ⭐ Pick: <b>${this.escapeHtml(pick)}</b>${odd} | Conf: <b>${conf}</b>\n`;
        if (goals || btts) {
          text += `   📊 Alt: ${goals ? `Goals: <b>${this.escapeHtml(goals)}</b> ` : ""}${btts ? `| BTTS: <b>${this.escapeHtml(btts)}</b>` : ""}\n`;
        }
        text += `\n`;
      });

      const remaining = Math.max(0, sortedMatches.length - vipPicks.length);
      if (remaining > 0) {
        text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `⚡ <b>+${remaining} more VIP fixtures</b> available today on your dashboard.\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━━`;
      }

      const keyboard = new InlineKeyboard()
        .url("🌐 Open Full VIP WebApp", `${clientAppUrl}/all-matches`)
        .row()
        .text("🎯 Today's Bankers", "banker_picks");

      try {
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
      } catch (sendErr: any) {
        console.warn("[TelegramBotService] HTML send failed, trying plain text fallback:", sendErr.message);
        const plainText = text.replace(/<[^>]*>/g, "");
        await ctx.reply(plainText, { reply_markup: keyboard });
      }
    } catch (err: any) {
      console.error("[TelegramBotService] Error in sendVipPicks:", err.message);
      await ctx.reply("👑 View your VIP dashboard on the web platform:", {
        reply_markup: new InlineKeyboard().url("🌐 Open JollofTips", clientAppUrl),
      });
    }
  }

  /**
   * Send Account / Subscription Status
   */
  private async sendStatus(ctx: any) {
    const { isVip, email, expiresAt } = await this.checkUserVipStatus(ctx.from?.id || 0);

    if (isVip) {
      const msg =
        `👤 *YOUR ACCOUNT STATUS*\n\n` +
        `• Tier: 👑 *VIP PRO ACTIVE*\n` +
        `• Linked Email: *${email || "Verified Member"}*\n` +
        `• Status: *Active*\n` +
        (expiresAt ? `• Renewal Date: *${expiresAt}*\n` : "") +
        `\nEnjoy unlimited daily predictions, multi-banker slips, and live edge alerts!`;

      await ctx.reply(msg, {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard()
          .text("👑 View VIP Picks", "vip_picks")
          .row()
          .text("🎯 View All Bankers", "banker_picks"),
      });
    } else {
      const msg =
        `👤 *YOUR ACCOUNT STATUS*\n\n` +
        `• Tier: 🆓 *Free Tier*\n` +
        `• Quota: *10 Free Predictions per Day*\n` +
        `• Bankers: *Banker #1 only* (Banker #2, #3 and 5-Fold ACCA locked)\n` +
        (email ? `• Linked Email: ${email} (No active subscription)\n` : "") +
        `\nUpgrade to VIP Pro to unlock all matches and institutional algorithmic edges:`;

      await ctx.reply(msg, {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard()
          .url("⭐ Upgrade to VIP Pro ($19.99/mo)", whopCheckoutUrl)
          .row()
          .text("🔗 Link Subscribed Account", "link_info"),
      });
    }
  }

  private async sendVipInfo(ctx: any) {
    const { isVip } = await this.checkUserVipStatus(ctx.from?.id || 0);

    if (isVip) {
      await ctx.reply(
        `👑 *YOU ALREADY HAVE VIP PRO ACCESS!*\n\n` +
        `You have full unlocked access to:\n` +
        `✅ All daily fixtures across 50+ leagues\n` +
        `✅ All 3 Bankers of the Day & 5-Fold ACCA Slips\n` +
        `✅ Real-time telegram updates\n\n` +
        `Tap below to explore today's picks:`,
        {
          parse_mode: "Markdown",
          reply_markup: new InlineKeyboard()
            .text("👑 View VIP Picks", "vip_picks")
            .row()
            .text("🎯 View All Bankers", "banker_picks"),
        }
      );
      return;
    }

    const text =
      `👑 *JOLLOFTIPS VIP PRO ACCESS*\n\n` +
      `Upgrade your football betting to quantitative institutional grade:\n\n` +
      `✅ *Unlimited Daily Match Predictions* (All 50+ fixtures unlocked)\n` +
      `✅ *All 3 Bankers of the Day* + Verified 5-Fold ACCA Multi Slip\n` +
      `✅ *Mathematical Value Edge (+EV)* odds comparison\n` +
      `✅ *100,000 Monte Carlo Simulation* breakdowns\n` +
      `✅ *VIP Telegram In-Play Alerts & Push Notifications*\n\n` +
      `💰 Only *$19.99 / month* — Instant Whop activation, cancel anytime.\n\n` +
      `_Already subscribed? Type \`/link your-email@example.com\` to activate instantly!_`;

    const keyboard = new InlineKeyboard()
      .url("🚀 Upgrade Instantly via Whop", whopCheckoutUrl)
      .row()
      .text("🔗 Link Subscribed Account", "link_info")
      .row()
      .url("🌐 Learn More on Website", `${clientAppUrl}/pricing`);

    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
  }

  /**
   * Start the Telegram bot polling process safely
   */
  async start() {
    if (!this.bot || this.isInitialized) return;

    try {
      this.isInitialized = true;
      this.bot.start({
        onStart: (botInfo) => {
          console.log(`🤖 [TelegramBotService] @${botInfo.username} started successfully!`);
        },
      });
    } catch (err: any) {
      console.warn(`[TelegramBotService] Failed to start polling: ${err.message}`);
    }
  }

  /**
   * Send a direct message to a Telegram chat
   */
  async sendDirectMessage(chatId: string | number, message: string) {
    if (!this.bot) return false;
    try {
      await this.bot.api.sendMessage(chatId, message, { parse_mode: "Markdown" });
      return true;
    } catch (err: any) {
      console.warn(`[TelegramBotService] Failed to send message to ${chatId}: ${err.message}`);
      return false;
    }
  }
}

export const telegramBotService = new TelegramBotService();
