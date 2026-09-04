import * as cheerio from "cheerio";

const BASE_URL = "https://nerdytips.com";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

export class NerdyTipsAuthManager {
  private static cachedCookie: string | null = process.env.NERDYTIPS_COOKIE || null;
  private static lastLoginAttempt: number = 0;
  private static loginInProgress: Promise<string | null> | null = null;

  /**
   * Get active cookie header (either from env, cache, or dynamic login)
   */
  static async getCookieHeader(): Promise<string | null> {
    if (this.cachedCookie) {
      return this.cachedCookie;
    }

    const username = process.env.NERDYTIPS_USERNAME || process.env.NERDYTIPS_EMAIL;
    const password = process.env.NERDYTIPS_PASSWORD;

    if (!username || !password) {
      return null;
    }

    // Deduplicate concurrent login requests
    if (this.loginInProgress) {
      return this.loginInProgress;
    }

    this.loginInProgress = this.performLogin(username, password).finally(() => {
      this.loginInProgress = null;
    });

    return this.loginInProgress;
  }

  /**
   * Perform dynamic login to NerdyTips and extract session cookies
   */
  static async performLogin(username: string, password: string): Promise<string | null> {
    try {
      console.log(`[NerdyTipsAuth] Authenticating as "${username}"...`);
      this.lastLoginAttempt = Date.now();

      // 1. GET /login page to retrieve initial CSRF token & session cookie
      const loginPageRes = await fetch(`${BASE_URL}/login`, {
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        cache: "no-store",
      });

      if (!loginPageRes.ok) {
        throw new Error(`Failed to load login page: HTTP ${loginPageRes.status}`);
      }

      const initialCookies = loginPageRes.headers.getSetCookie?.() || [];
      const cookieMap: Record<string, string> = {};

      const parseCookies = (setCookieList: string[]) => {
        for (const str of setCookieList) {
          const main = str.split(";")[0];
          const [key, ...valParts] = main.split("=");
          if (key && valParts.length > 0) {
            cookieMap[key.trim()] = valParts.join("=").trim();
          }
        }
      };

      parseCookies(initialCookies);

      const html = await loginPageRes.text();
      const $ = cheerio.load(html);

      // Extract CSRF token from input name="_csrf"
      const csrfToken = $('input[name="_csrf"]').first().val() as string;

      const cookieHeaderValue = Object.entries(cookieMap)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");

      // 2. Submit POST /login form
      const bodyParams = new URLSearchParams({
        _csrf: csrfToken || "",
        username: username,
        password: password,
        remember: "1",
      });

      const loginPostRes = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookieHeaderValue,
          Referer: `${BASE_URL}/login`,
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json, text/plain, */*",
        },
        body: bodyParams.toString(),
        cache: "no-store",
      });

      const postText = await loginPostRes.text();
      let postJson: any = null;
      try {
        postJson = JSON.parse(postText);
      } catch {
        // Not JSON
      }

      if (postJson) {
        if (postJson.device_blocked || postJson.error?.includes("device limit")) {
          console.warn(
            `[NerdyTipsAuth] Account device limit reached! NerdyTips message: "${postJson.error}". Please log in on nerdy-tips website and reset devices or set NERDYTIPS_COOKIE in .env.`
          );
        } else if (postJson.ok === false) {
          console.warn(`[NerdyTipsAuth] Login failed: ${postJson.error || "Unknown error"}`);
        }
      }

      const postSetCookies = loginPostRes.headers.getSetCookie?.() || [];
      parseCookies(postSetCookies);

      const finalCookieString = Object.entries(cookieMap)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");

      if (finalCookieString) {
        if (postJson?.ok !== false) {
          console.log(`[NerdyTipsAuth] Login successful. Session cookie acquired.`);
        }
        this.cachedCookie = finalCookieString;
        return finalCookieString;
      }

      return null;
    } catch (err: any) {
      console.error("[NerdyTipsAuth] Login failed:", err.message || err);
      return null;
    }
  }

  /**
   * Explicitly set session cookie (e.g. from manual configuration or admin panel)
   */
  static setCookie(cookie: string) {
    this.cachedCookie = cookie;
  }

  /**
   * Invalidate cached session (e.g., if predictions return locked despite cookie)
   */
  static invalidate() {
    this.cachedCookie = null;
  }
}
