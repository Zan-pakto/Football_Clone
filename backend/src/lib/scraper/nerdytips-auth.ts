export interface NerdyTipsAuthResult {
  isAuthenticated: boolean;
  cookieHeader: string | null;
  error?: string;
}

export class NerdyTipsAuthService {
  private baseUrl = "https://nerdytips.com";
  private userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  /**
   * Fetch CSRF token and initial session cookie from /login
   */
  private async getInitialSession(): Promise<{ csrfToken: string | null; initialCookie: string | null }> {
    try {
      const res = await fetch(`${this.baseUrl}/login`, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      const html = await res.text();
      const csrfMatch = html.match(/<input[^>]*name="_csrf"[^>]*value="([^"]*)"/i);
      const csrfToken = csrfMatch ? csrfMatch[1] : null;

      const setCookie = res.headers.get("set-cookie") || "";
      const cookieMatch = setCookie.match(/nt_sess=([^;]+)/);
      const initialCookie = cookieMatch ? `nt_sess=${cookieMatch[1]}` : null;

      return { csrfToken, initialCookie };
    } catch (err: any) {
      console.warn("[NerdyTipsAuth] Error fetching initial login page:", err.message);
      return { csrfToken: null, initialCookie: null };
    }
  }

  /**
   * Log in to NerdyTips with configured or provided credentials
   */
  async login(username?: string, password?: string): Promise<NerdyTipsAuthResult> {
    const user = username || process.env.NERDYTIPS_USERNAME;
    const pass = password || process.env.NERDYTIPS_PASSWORD;

    if (!user || !pass) {
      // Credentials not configured; proceed unauthenticated
      return { isAuthenticated: false, cookieHeader: null };
    }

    try {
      const { csrfToken, initialCookie } = await this.getInitialSession();
      if (!csrfToken) {
        return { isAuthenticated: false, cookieHeader: null, error: "Failed to extract CSRF token" };
      }

      const body = new URLSearchParams({
        _csrf: csrfToken,
        username: user,
        password: pass,
        remember: "1",
      });

      const res = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "User-Agent": this.userAgent,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Cookie: initialCookie || "",
          Origin: this.baseUrl,
          Referer: `${this.baseUrl}/login`,
        },
        body: body.toString(),
        redirect: "manual", // Capture 302 redirect response with auth cookie
      });

      // Look for updated auth cookie in set-cookie headers
      const setCookieHeader = res.headers.get("set-cookie") || "";
      const authCookieMatch = setCookieHeader.match(/nt_sess=([^;]+)/);
      const sessionCookie = authCookieMatch ? `nt_sess=${authCookieMatch[1]}` : initialCookie;

      const isRedirectSuccess = res.status === 302 || res.status === 200;
      if (isRedirectSuccess && sessionCookie) {
        console.log("[NerdyTipsAuth] Successfully authenticated with NerdyTips.");
        return { isAuthenticated: true, cookieHeader: sessionCookie };
      }

      console.warn(`[NerdyTipsAuth] Login returned HTTP ${res.status}. Falling back to unauthenticated.`);
      return { isAuthenticated: false, cookieHeader: null, error: `HTTP ${res.status}` };
    } catch (err: any) {
      console.error("[NerdyTipsAuth] Login request failed:", err.message);
      return { isAuthenticated: false, cookieHeader: null, error: err.message };
    }
  }

  /**
   * Log out from NerdyTips to terminate the session cleanly
   */
  async logout(cookieHeader: string | null): Promise<void> {
    if (!cookieHeader) return;

    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: "POST",
        headers: {
          "User-Agent": this.userAgent,
          Cookie: cookieHeader,
          Origin: this.baseUrl,
          Referer: this.baseUrl,
        },
      });
      console.log("[NerdyTipsAuth] Successfully logged out from NerdyTips.");
    } catch (err: any) {
      // Logout is best-effort
      console.warn("[NerdyTipsAuth] Logout request completed with notice:", err.message);
    }
  }
}

export const nerdyTipsAuth = new NerdyTipsAuthService();
