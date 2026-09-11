import { Router, Request, Response } from "express";
import { authService } from "../lib/auth/auth-service";
import { sessionService } from "../lib/auth/session-service";

const router = Router();

// Helper to extract auth token from header or cookie
function getAuthToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.auth_token;
  return authHeader?.replace("Bearer ", "") || cookieToken;
}

// GET /api/auth
router.get("/", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);
    return res.json({
      success: true,
      isLoggedIn: Boolean(user),
      user: user || null,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth
router.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { action, email, password, name } = body;

    const userAgent = req.headers["user-agent"] || "Browser";
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

    if (action === "register") {
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required" });
      }
      const { user, token } = await authService.register({ email, password, name });
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({ success: true, user, message: "Registered successfully" });
    }

    if (action === "login") {
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required" });
      }
      const { user, token } = await authService.login({
        email,
        password,
        userAgent,
        ipAddress,
        deviceName: userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Computer",
      });
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({ success: true, user, message: "Logged in successfully" });
    }

    if (action === "logout") {
      res.clearCookie("auth_token", { path: "/" });
      return res.json({ success: true, message: "Logged out" });
    }

    // Authenticated actions
    const token = getAuthToken(req);
    const currentUser = await authService.getCurrentUser(token);

    if (!currentUser) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (action === "update_profile") {
      const updatedUser = await authService.updateProfile(currentUser.id, { name });
      return res.json({
        success: true,
        user: updatedUser,
        message: "Profile updated successfully",
      });
    }

    if (action === "change_password") {
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
    return res.status(400).json({ success: false, error: error.message || "Authentication error" });
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
