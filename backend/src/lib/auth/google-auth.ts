/**
 * Google OAuth 2.0 Helper
 * Provides URL generation, token exchange, and ID token verification
 * using native fetch and standard Google OAuth endpoints.
 */

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export class GoogleAuthService {
  private getClientId(): string {
    return (process.env.GOOGLE_CLIENT_ID || "").trim();
  }

  private getClientSecret(): string {
    return (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  }

  private getRedirectUri(): string {
    // Default to backend callback or configured env
    return (
      (process.env.GOOGLE_REDIRECT_URI || "").trim() ||
      "http://localhost:5000/api/auth/google/callback"
    );
  }

  public isConfigured(): boolean {
    const cid = this.getClientId();
    const secret = this.getClientSecret();
    return Boolean(cid && secret && cid.length > 5 && secret.length > 5);
  }

  /**
   * Generates Google OAuth consent screen URL
   */
  public getAuthUrl(state?: string, customRedirectUri?: string): string {
    const clientId = this.getClientId();
    const redirectUri = customRedirectUri || this.getRedirectUri();

    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID is not configured in .env");
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });

    if (state) {
      params.append("state", state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for Google access_token and id_token
   */
  public async exchangeCode(
    code: string,
    customRedirectUri?: string
  ): Promise<{ access_token: string; id_token?: string; token_type: string }> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = customRedirectUri || this.getRedirectUri();

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth client credentials are missing in .env");
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GoogleAuth] Token exchange failed:", errorText);
      throw new Error(`Google token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Fetches user profile from Google using access_token
   */
  public async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GoogleAuth] Failed to fetch userinfo:", errorText);
      throw new Error("Failed to retrieve user profile from Google");
    }

    const profile: GoogleUserInfo = await response.json();
    if (!profile.email) {
      throw new Error("Google profile did not contain an email address");
    }

    return profile;
  }

  /**
   * Verifies Google ID token (e.g. from Google One-Tap / GIS client button)
   */
  public async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Invalid or expired Google ID token");
    }

    const data = await response.json();

    // Check audience if client ID is configured
    const clientId = this.getClientId();
    if (clientId && data.aud && data.aud !== clientId) {
      console.warn(`[GoogleAuth] Token audience (${data.aud}) does not match client ID (${clientId})`);
    }

    if (!data.email) {
      throw new Error("Google ID token has no email associated");
    }

    return {
      sub: data.sub,
      email: data.email,
      email_verified: data.email_verified === "true" || data.email_verified === true,
      name: data.name,
      given_name: data.given_name,
      family_name: data.family_name,
      picture: data.picture,
    };
  }
}

export const googleAuthService = new GoogleAuthService();
