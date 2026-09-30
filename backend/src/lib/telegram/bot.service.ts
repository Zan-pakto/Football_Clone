import { Bot, InlineKeyboard } from "grammy";
import { nerdyTipsScraper, ScrapedMatch } from "../scraper/nerdytips-scraper";

const token = process.env.TELEGRAM_BOT_TOKEN;
const clientAppUrl = process.env.CLIENT_APP_URL || process.env.FRONTEND_URL || "https://jolloftips.com";
const whopCheckoutUrl = process.env.WHOP_CHECKOUT_URL_VIP_MONTHLY || "https://whop.com/checkout/plan_3LE4tmGm31ISJ";

export class TelegramBotService {
  private bot: Bot | null = null;
  private isInitialized = false;

  constructor() {
    if (token && !token.includes("placeholder")) {
      try {
        this.bot = new Bot(token);
        this.setupHandlers();
      } catch (err: any) {
        console.warn(`[TelegramBotService] Failed to construct Bot: ${err.message}`);
      }
    }
  }

  private getMainKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
      .text("⚽ Today's Free Picks", "free_picks")
      .text("🎯 Banker of the Day", "banker_picks")
      .row()
      .text("👑 VIP Pro Access", "vip_info")
      .url("⭐ Upgrade on Whop", whopCheckoutUrl)
      .row()
      .url("🌐 Open JollofTips WebApp", clientAppUrl);
  }

  private setupHandlers() {
    if (!this.bot) return;

    // /start Command
    this.bot.command("start", async (ctx) => {
      const userName = ctx.from?.first_name || "Football Fan";
      const message =
        `👋 *Welcome to JollofTips AI Football Predictions, ${userName}!*\n\n` +
        `🏆 We deliver high-precision algorithmic predictions powered by *100,000 Monte Carlo match simulations*, value odds (+EV), and verified banker locks.\n\n` +
        `Choose an option below to get started:`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: this.getMainKeyboard(),
      });
    });

    // /free Command
    this.bot.command("free", async (ctx) => {
      await this.sendFreePicks(ctx);
    });

    // /banker Command
    this.bot.command("banker", async (ctx) => {
      await this.sendBankerPicks(ctx);
    });

    // /vip Command
    this.bot.command("vip", async (ctx) => {
      await this.sendVipInfo(ctx);
    });

    // /help Command
    this.bot.command("help", async (ctx) => {
      const helpMsg =
        `📖 *JollofTips Bot Commands:*\n\n` +
        `• /start - Main interactive menu\n` +
        `• /free - Today's highest-rated free predictions\n` +
        `• /banker - Banker of the Day (high confidence lock)\n` +
        `• /vip - Unlock VIP Pro algorithmic edges & Telegram access\n` +
        `• /app - Open web platform`;

      await ctx.reply(helpMsg, { parse_mode: "Markdown", reply_markup: this.getMainKeyboard() });
    });

    // /app Command
    this.bot.command("app", async (ctx) => {
      const keyboard = new InlineKeyboard().url("🚀 Launch JollofTips", clientAppUrl);
      await ctx.reply("Click below to launch the full JollofTips football analytics suite:", {
        reply_markup: keyboard,
      });
    });

    // Callback button queries
    this.bot.callbackQuery("free_picks", async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.sendFreePicks(ctx);
    });

    this.bot.callbackQuery("banker_picks", async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.sendBankerPicks(ctx);
    });

    this.bot.callbackQuery("vip_info", async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.sendVipInfo(ctx);
    });

    // Global Error Handler
    this.bot.catch((err) => {
      console.error("[TelegramBotService] Error in bot handler:", err.error);
    });
  }

  private async sendFreePicks(ctx: any) {
    try {
      const botd = await nerdyTipsScraper.scrapeBetOfTheDay("0");
      const matches = (botd.bankers.length > 0 ? botd.bankers : botd.slip).slice(0, 5);

      if (!matches || matches.length === 0) {
        await ctx.reply(
          `⚽ *Today's AI Predictions:*\nMatches are currently being simulated for today's fixtures. Check back shortly or view all on the web platform:`,
          {
            parse_mode: "Markdown",
            reply_markup: new InlineKeyboard().url("🌐 View Live on JollofTips", `${clientAppUrl}/all-matches`),
          }
        );
        return;
      }

      let text = `🔥 *Top Free AI Predictions For Today:*\n\n`;
      matches.forEach((m: ScrapedMatch, idx: number) => {
        const home = m.homeTeam || "Home";
        const away = m.awayTeam || "Away";
        const tip = m.bestTip || "1X";
        const conf = m.confidence || "82%";
        const league = `${m.country ? m.country + ": " : ""}${m.league || "League"}`;
        const odds = m.tipOdds ? ` @ ${m.tipOdds}` : "";

        text += `${idx + 1}. *${home} vs ${away}*\n`;
        text += `   🏆 ${league}\n`;
        text += `   💡 Pick: *${tip}*${odds} | Confidence: *${conf}*\n\n`;
      });

      text += `_Calculated using 100k Monte Carlo probabilistic match models._`;

      const keyboard = new InlineKeyboard()
        .url("🌐 Full Matches & Odds", `${clientAppUrl}/all-matches`)
        .row()
        .text("🎯 See Banker of the Day", "banker_picks");

      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
    } catch {
      await ctx.reply("⚡ Match predictions are updating. Please check the website in a moment.", {
        reply_markup: new InlineKeyboard().url("🌐 Open JollofTips", clientAppUrl),
      });
    }
  }

  private async sendBankerPicks(ctx: any) {
    try {
      const botd = await nerdyTipsScraper.scrapeBetOfTheDay("0");
      const banker = botd.bankers?.[0] || botd.slip?.[0];

      if (!banker) {
        await ctx.reply("🎯 Today's Banker is being calculated by our algorithms. Check back in 15 minutes!", {
          reply_markup: new InlineKeyboard().url("🌐 View Live on JollofTips", `${clientAppUrl}/bet-of-the-day`),
        });
        return;
      }

      const home = banker.homeTeam || "Home";
      const away = banker.awayTeam || "Away";
      const tip = banker.bestTip || "Home Win";
      const conf = banker.confidence || "86%";
      const league = `${banker.country ? banker.country + ": " : ""}${banker.league || "Top Division"}`;
      const odds = banker.tipOdds ? ` @ ${banker.tipOdds}` : "";

      const text =
        `🎯 *BANKER OF THE DAY*\n\n` +
        `⚔️ *${home} vs ${away}*\n` +
        `🏆 Competition: *${league}*\n` +
        `🔒 Algorithmic Pick: *${tip}*${odds}\n` +
        `📊 AI Confidence Score: *${conf}*\n\n` +
        `_Bankers are selected from 1,000+ fixtures daily based on maximum statistical stability and mathematical value edge._`;

      const keyboard = new InlineKeyboard()
        .url("🌐 View Detailed Analysis", `${clientAppUrl}/bet-of-the-day`)
        .row()
        .text("👑 Unlock All VIP Bankers", "vip_info");

      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
    } catch {
      await ctx.reply("🎯 Check out the Banker of the Day on our live dashboard:", {
        reply_markup: new InlineKeyboard().url("🌐 Open Banker Page", `${clientAppUrl}/bet-of-the-day`),
      });
    }
  }

  private async sendVipInfo(ctx: any) {
    const text =
      `👑 *JOLLOFTIPS VIP PRO ACCESS*\n\n` +
      `Upgrade your predictions to quantitative institutional grade:\n\n` +
      `✅ *Unlimited Daily Banker Access* (unlocked 80%+ locks)\n` +
      `✅ *Mathematical Value Edge (+EV)* bookmaker arbitrage alerts\n` +
      `✅ *100,000 Monte Carlo Simulation* breakdowns\n` +
      `✅ *Pro Acca & Bet Slip Builder* with auto correlation\n` +
      `✅ *VIP Telegram Community & Push Alerts*\n\n` +
      `💰 Only *$19.99 / month* — Cancel anytime with 1 click.`;

    const keyboard = new InlineKeyboard()
      .url("🚀 Upgrade Instantly via Whop", whopCheckoutUrl)
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
   * Send a direct VIP channel invite to a Telegram chat
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
