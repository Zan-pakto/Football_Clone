import { Router, Request, Response } from "express";
import { authService } from "../lib/auth/auth-service";
import { sessionService } from "../lib/auth/session-service";
import { googleAuthService } from "../lib/auth/google-auth";

const router = Router();

// Helper to extract auth token from header or cookie
function getAuthToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (bearerToken && bearerToken !== "null" && bearerToken !== "undefined" && bearerToken.length > 10) {
    return bearerToken;
  }
  const cookieToken = req.cookies?.auth_token;
  if (cookieToken && cookieToken !== "null" && cookieToken !== "undefined") {
    return cookieToken;
  }
  return undefined;
}

// GET /api/auth
router.get("/", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);
    console.log(`👤 [AUTH:SESSION_CHECK] ${user ? `Logged in as ${user.email} (${user.role})` : "Guest session (not logged in)"}`);
    return res.json({
      success: true,
      isLoggedIn: Boolean(user),
      user: user || null,
      token: user && token ? token : null,
    });
  } catch (error: any) {
    console.error(`❌ [AUTH:SESSION_ERROR]`, error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth
router.post("/", async (req: Request, res: Response) => {
  try {
    let body = req.body || {};
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const action = (body.action || (req.query.action as string) || "login").toString().toLowerCase();
    const name = body.name || "";
    const email = (
      body.email ||
      body.loginIdentifier ||
      body.username ||
      body.identifier ||
      body.user ||
      (req.query.email as string) ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();

    const password = (
      body.password ||
      body.pass ||
      (req.query.password as string) ||
      ""
    ).toString();

    const userAgent = (req.headers["user-agent"] as string) || "Browser";
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

    const isProd = process.env.NODE_ENV === "production";

    if (action === "register") {
      console.log(`📝 [AUTH:REGISTER_ATTEMPT] Email: ${email} | IP: ${ipAddress}`);
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required" });
      }
      const { user, token } = await authService.register({ email, password, name });
      console.log(`✨ [AUTH:REGISTER_SUCCESS] User: ${user.email} | ID: ${user.id} | Plan: ${user.subscriptionPlan}`);
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({ success: true, user, token, message: "Registered successfully" });
    }

    if (action === "login") {
      console.log(`🔑 [AUTH:LOGIN_ATTEMPT] Email: ${email} | IP: ${ipAddress} | Device: ${userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Computer"}`);
      if (!email || !password) {
        console.log(`❌ [AUTH:LOGIN_FAILED] Missing email or password`);
        return res.status(400).json({ success: false, error: "Email and password are required" });
      }
      try {
        const { user, token } = await authService.login({
          email,
          password,
          userAgent,
          ipAddress,
          deviceName: userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Computer",
        });
        console.log(`✅ [AUTH:LOGIN_SUCCESS] Successfully logged in: ${user.email} (Role: ${user.role}, Plan: ${user.subscriptionPlan}, ID: ${user.id})`);
        res.cookie("auth_token", token, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? "none" : "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.json({ success: true, user, token, message: "Logged in successfully" });
      } catch (loginErr: any) {
        console.log(`❌ [AUTH:LOGIN_FAILED] Email: ${email} | Reason: ${loginErr.message}`);
        return res.status(400).json({ success: false, error: loginErr.message || "Invalid credentials" });
      }
    }

    if (action === "logout") {
      console.log(`🚪 [AUTH:LOGOUT] User logged out, clearing cookie`);
      res.clearCookie("auth_token", {
        path: "/",
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
      });
      return res.json({ success: true, message: "Logged out" });
    }

    // Authenticated actions
    const token = getAuthToken(req);
    const currentUser = await authService.getCurrentUser(token);

    if (!currentUser) {
      console.log(`⚠️ [AUTH:UNAUTHORIZED] Action '${action}' attempted without valid session`);
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (action === "update_profile") {
      console.log(`✏️ [AUTH:UPDATE_PROFILE] User: ${currentUser.email} | New Name: ${name}`);
      const updatedUser = await authService.updateProfile(currentUser.id, { name });
      return res.json({
        success: true,
        user: updatedUser,
        message: "Profile updated successfully",
      });
    }

    if (action === "change_password") {
      console.log(`🔒 [AUTH:CHANGE_PASSWORD] User: ${currentUser.email}`);
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: "Current and new passwords are required" });
      }
      await authService.changePassword(currentUser.id, currentPassword, newPassword);
      return res.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    return res.status(400).json({ success: false, error: "Invalid action" });
  } catch (error: any) {
    console.error(`💥 [AUTH:ERROR]`, error.message);
    return res.status(400).json({ success: false, error: error.message || "Authentication error" });
  }
});

// ══════════════════════════════════════════════════════════════════════
// GOOGLE AUTHENTICATION ENDPOINTS
// ══════════════════════════════════════════════════════════════════════

// GET /api/auth/google - Initiate Google OAuth Redirect
router.get("/google", async (req: Request, res: Response) => {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
  const state = (req.query.redirect as string) || "/";

  if (!googleAuthService.isConfigured()) {
    console.warn("⚠️ [AUTH:GOOGLE] Google OAuth is not configured in .env (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing)");
    // If the request accepts HTML, redirect to frontend login with descriptive error
    if (req.accepts("html")) {
      return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
    }
    return res.status(400).json({
      success: false,
      error: "Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env",
      code: "GOOGLE_NOT_CONFIGURED",
    });
  }

  try {
    const authUrl = googleAuthService.getAuthUrl(state);
    console.log("🔗 [AUTH:GOOGLE] Redirecting user to Google OAuth consent screen");
    return res.redirect(authUrl);
  } catch (err: any) {
    console.error("❌ [AUTH:GOOGLE_INIT_ERROR]", err.message);
    return res.redirect(`${frontendUrl}/login?error=google_init_failed`);
  }
});

// GET /api/auth/google/callback - Google OAuth Callback
router.get("/google/callback", async (req: Request, res: Response) => {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
  const { code, state, error: googleError } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  if (googleError) {
    console.log(`⚠️ [AUTH:GOOGLE_CALLBACK_CANCELLED] Google returned: ${googleError}`);
    return res.redirect(`${frontendUrl}/login?error=google_cancelled`);
  }

  if (!code) {
    console.log("❌ [AUTH:GOOGLE_CALLBACK_ERROR] Missing authorization code");
    return res.redirect(`${frontendUrl}/login?error=missing_code`);
  }

  try {
    console.log("🔄 [AUTH:GOOGLE_CALLBACK] Exchanging code for tokens...");
    const tokens = await googleAuthService.exchangeCode(code);
    let userInfo: any = null;

    if (tokens.id_token) {
      try {
        userInfo = await googleAuthService.verifyIdToken(tokens.id_token);
      } catch {
        // Fallback to userinfo endpoint
      }
    }

    if (!userInfo && tokens.access_token) {
      userInfo = await googleAuthService.getUserInfo(tokens.access_token);
    }

    if (!userInfo || !userInfo.email) {
      throw new Error("Unable to retrieve email from Google profile");
    }

    console.log(`✅ [AUTH:GOOGLE_CALLBACK_SUCCESS] Authenticated Google user: ${userInfo.email}`);

    const userAgent = (req.headers["user-agent"] as string) || "Browser";
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

    const { user, token } = await authService.loginOrRegisterWithGoogle({
      email: userInfo.email,
      name: userInfo.name || userInfo.email.split("@")[0],
      googleId: userInfo.sub,
      avatar: userInfo.picture,
      userAgent,
      ipAddress,
      deviceName: userAgent.includes("Mobile") ? "Mobile Device (Google)" : "Desktop (Google)",
    });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const targetRedirect = state && state.startsWith("/") ? state : "/";
    return res.redirect(
      `${frontendUrl}/login?google_auth=success&token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(targetRedirect)}`
    );
  } catch (error: any) {
    console.error("❌ [AUTH:GOOGLE_CALLBACK_FAIL]", error.message);
    return res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(error.message || "google_failed")}`
    );
  }
});

// POST /api/auth/google - Client-side ID Token / One-Tap Verification
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { credential, idToken, code } = req.body || {};
    const tokenToVerify = credential || idToken;

    let googleUser: any = null;

    if (tokenToVerify) {
      googleUser = await googleAuthService.verifyIdToken(tokenToVerify);
    } else if (code) {
      const tokens = await googleAuthService.exchangeCode(code);
      googleUser = await googleAuthService.getUserInfo(tokens.access_token);
    } else {
      return res.status(400).json({
        success: false,
        error: "Missing Google credential or authorization code",
      });
    }

    const userAgent = (req.headers["user-agent"] as string) || "Browser";
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

    const { user, token } = await authService.loginOrRegisterWithGoogle({
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.sub,
      avatar: googleUser.picture,
      userAgent,
      ipAddress,
      deviceName: userAgent.includes("Mobile") ? "Mobile Device (Google)" : "Desktop (Google)",
    });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      user,
      token,
      message: "Signed in with Google successfully",
    });
  } catch (error: any) {
    console.error("❌ [AUTH:GOOGLE_POST_FAIL]", error.message);
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to authenticate with Google",
    });
  }
});

// GET /api/auth/sessions
router.get("/sessions", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const sessions = await sessionService.getUserSessions(user.id);
    return res.json({
      success: true,
      sessions,
      maxAllowed: 5,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/sessions
router.post("/sessions", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { action, sessionId } = req.body || {};
    if (action === "revoke" && sessionId) {
      await sessionService.revokeSession(sessionId, user.id);
      return res.json({ success: true, message: "Session revoked successfully" });
    }

    return res.status(400).json({ success: false, error: "Invalid action" });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
