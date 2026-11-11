import { prisma } from "../db/prisma";
import { hashPassword, verifyPassword } from "./password";
import { createToken, verifyToken, TokenPayload } from "./jwt";
import { sessionService } from "./session-service";
import { betBuilderCreditsService } from "../bet-builder/credits-service";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: "USER" | "ADMIN";
  isPremium?: boolean;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  createdAt?: string;
}

// Helper to find non-expired active subscription
export function findActiveValidSubscription(subscriptions?: any[]): any | null {
  if (!subscriptions || !Array.isArray(subscriptions)) return null;
  const now = Date.now();
  for (const sub of subscriptions) {
    if (sub.status === "ACTIVE" || sub.status === "TRIALING") {
      const expiry = sub.currentPeriodEnd || sub.expiresAt;
      if (!expiry || new Date(expiry).getTime() > now) {
        return sub;
      }
    }
  }
  return null;
}

// Fallback user memory store
export const memoryUsers = new Map<string, { id: string; email: string; passwordHash: string; name: string; role: "USER" | "ADMIN"; createdAt: string }>();

export class AuthService {
  async register(params: {
    email: string;
    password: string;
    name?: string;
    role?: "USER" | "ADMIN";
  }): Promise<{ user: AuthUser; token: string }> {
    const { email, password, name, role = "USER" } = params;
    const emailLower = email.toLowerCase().trim();

    const passwordHash = await hashPassword(password);
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const nowIso = now.toISOString();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const trialEndsAtIso = trialEndsAt.toISOString();

    let user: AuthUser;
    await betBuilderCreditsService.ensureSchema();

    try {
      const created = await prisma.user.create({
        data: {
          id: userId,
          email: emailLower,
          passwordHash,
          name: name || emailLower.split("@")[0],
          role: role as any,
        },
      });

      // Grant 7-day free premium trial subscription for any signup
      await prisma.subscription.create({
        data: {
          userId: created.id,
          plan: role === "ADMIN" ? "VIP_PRO" : "7_DAY_TRIAL",
          status: role === "ADMIN" ? "ACTIVE" : "TRIALING",
          provider: "trial",
          providerSubId: `trial_${created.id}`,
          startedAt: now,
          expiresAt: role === "ADMIN" ? new Date(now.getTime() + 10 * 365 * 86400000) : trialEndsAt,
          currentPeriodEnd: role === "ADMIN" ? new Date(now.getTime() + 10 * 365 * 86400000) : trialEndsAt,
        },
      }).catch((e) => {
        console.warn("[AuthService] Notice creating trial subscription:", e.message);
      });

      user = {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role as any,
        isPremium: true, // 7-day free premium trial is active
        subscriptionPlan: role === "ADMIN" ? "VIP_PRO" : "7_DAY_TRIAL",
        subscriptionStatus: role === "ADMIN" ? "ACTIVE" : "TRIALING",
        trialEndsAt: role === "ADMIN" ? null : trialEndsAtIso,
        createdAt: created.createdAt.toISOString(),
      };
    } catch {
      // Memory fallback
      memoryUsers.set(emailLower, {
        id: userId,
        email: emailLower,
        passwordHash,
        name: name || emailLower.split("@")[0],
        role,
        createdAt: nowIso,
      });
      user = {
        id: userId,
        email: emailLower,
        name: name || emailLower.split("@")[0],
        role,
        isPremium: true, // 7-day free premium trial
        subscriptionPlan: role === "ADMIN" ? "VIP_PRO" : "7_DAY_TRIAL",
        subscriptionStatus: role === "ADMIN" ? "ACTIVE" : "TRIALING",
        trialEndsAt: role === "ADMIN" ? null : trialEndsAtIso,
        createdAt: nowIso,
      };
    }

    const sessionId = `sess_${Date.now()}`;
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    });

    await sessionService.createSession({
      userId: user.id,
      token,
      deviceName: "Primary Device",
    });

    return { user, token };
  }

  async login(params: {
    email: string;
    password: string;
    deviceName?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ user: AuthUser; token: string }> {
    const { email, password, deviceName, userAgent, ipAddress } = params;
    const emailLower = email.toLowerCase().trim();

    let dbUser: any = null;
    await betBuilderCreditsService.ensureSchema();
    try {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailLower },
            { name: { equals: emailLower, mode: "insensitive" } },
          ],
        },
        include: { subscriptions: true },
      });
    } catch {
      dbUser = memoryUsers.get(emailLower);
      if (!dbUser) {
        for (const u of memoryUsers.values()) {
          if (u.name.toLowerCase() === emailLower) {
            dbUser = u;
            break;
          }
        }
      }
    }

    // Default admin / demo user fallback: ensure admin user exists in DB
    if (!dbUser && (emailLower === "admin@jolloftips.com" || emailLower === "admin@footyintel.com" || emailLower === "don@nerdytips.com")) {
      const adminPasswordHash = await hashPassword("password123");
      try {
        dbUser = await prisma.user.upsert({
          where: { email: emailLower },
          update: {
            role: "ADMIN",
          },
          create: {
            id: "admin_master_001",
            email: emailLower,
            passwordHash: adminPasswordHash,
            name: "Pro Administrator",
            role: "ADMIN",
          },
          include: { subscriptions: true },
        });

        // Ensure VIP_PRO subscription exists in DB
        const existingSub = await prisma.subscription.findFirst({
          where: { userId: dbUser.id },
        });
        if (!existingSub) {
          await prisma.subscription.create({
            data: {
              userId: dbUser.id,
              plan: "VIP_PRO",
              status: "ACTIVE",
              expiresAt: new Date(Date.now() + 10 * 365 * 86400000),
            },
          }).catch(() => {});
        }
      } catch {
        // Memory fallback if DB unavailable
        dbUser = {
          id: "admin_master_001",
          email: emailLower,
          passwordHash: adminPasswordHash,
          name: "Pro Administrator",
          role: "ADMIN",
          createdAt: new Date("2024-01-01").toISOString(),
        };
        memoryUsers.set(emailLower, dbUser);
      }
    }

    if (!dbUser) {
      throw new Error("Invalid email or password");
    }

    // Check if user is blocked
    const { adminService } = await import("../admin/admin-service");
    if (adminService.isBlocked(dbUser.id, dbUser.email)) {
      throw new Error("Your account has been suspended by the administrator. Please contact support.");
    }

    const isValid = await verifyPassword(password, dbUser.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const override = adminService.getUserOverride(dbUser.id);
    const activeSub = findActiveValidSubscription(dbUser.subscriptions);
    const isWithin7DaysOfSignup = dbUser.createdAt && (Date.now() - new Date(dbUser.createdAt).getTime() < 7 * 86400000);
    const isTrialActive = Boolean(activeSub?.status === "TRIALING" || (!activeSub && isWithin7DaysOfSignup && dbUser.role !== "ADMIN"));
    const isPremium = Boolean(activeSub || dbUser.role === "ADMIN" || isWithin7DaysOfSignup || (override?.tier && override.tier !== "FREE"));
    const trialEndsAt = activeSub?.expiresAt ? new Date(activeSub.expiresAt).toISOString() : (isWithin7DaysOfSignup ? new Date(new Date(dbUser.createdAt).getTime() + 7 * 86400000).toISOString() : null);

    const subscriptionPlan = override?.tier || (activeSub ? activeSub.plan : (dbUser.role === "ADMIN" ? "VIP_PRO" : (isTrialActive ? "7_DAY_TRIAL" : "FREE")));
    const subscriptionStatus = override?.subscriptionStatus || (activeSub ? activeSub.status : (dbUser.role === "ADMIN" ? "ACTIVE" : (isTrialActive ? "TRIALING" : "FREE")));

    const user: AuthUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || dbUser.email.split("@")[0],
      role: dbUser.role,
      isPremium,
      subscriptionPlan,
      subscriptionStatus,
      trialEndsAt,
      createdAt: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
    };

    const sessionId = `sess_${Date.now()}`;
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    });

    await sessionService.createSession({
      userId: user.id,
      token,
      deviceName,
      userAgent,
      ipAddress,
    });

    return { user, token };
  }

  async loginOrRegisterWithGoogle(params: {
    email: string;
    name?: string;
    googleId?: string;
    avatar?: string;
    deviceName?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ user: AuthUser; token: string }> {
    const { email, name, deviceName, userAgent, ipAddress } = params;
    const emailLower = email.toLowerCase().trim();

    let dbUser: any = null;
    await betBuilderCreditsService.ensureSchema();
    try {
      dbUser = await prisma.user.findFirst({
        where: { email: emailLower },
        include: { subscriptions: true },
      });
    } catch {
      dbUser = memoryUsers.get(emailLower);
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const trialEndsAtIso = trialEndsAt.toISOString();

    if (!dbUser) {
      // Generate a secure random password hash for OAuth users
      const randomPassword = `OAuth_Google_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const passwordHash = await hashPassword(randomPassword);
      const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const role: "USER" | "ADMIN" = (emailLower === "admin@jolloftips.com" || emailLower === "admin@footyintel.com") ? "ADMIN" : "USER";

      try {
        dbUser = await prisma.user.create({
          data: {
            id: userId,
            email: emailLower,
            passwordHash,
            name: name || emailLower.split("@")[0],
            role,
          },
          include: { subscriptions: true },
        });

        // Grant 7-day free premium trial subscription for new Google signups
        await prisma.subscription.create({
          data: {
            userId: dbUser.id,
            plan: role === "ADMIN" ? "VIP_PRO" : "7_DAY_TRIAL",
            status: role === "ADMIN" ? "ACTIVE" : "TRIALING",
            provider: "trial",
            providerSubId: `trial_${dbUser.id}`,
            startedAt: now,
            expiresAt: role === "ADMIN" ? new Date(now.getTime() + 10 * 365 * 86400000) : trialEndsAt,
            currentPeriodEnd: role === "ADMIN" ? new Date(now.getTime() + 10 * 365 * 86400000) : trialEndsAt,
          },
        }).catch((e) => {
          console.warn("[AuthService] Google signup trial notice:", e.message);
        });
      } catch {
        dbUser = {
          id: userId,
          email: emailLower,
          name: name || emailLower.split("@")[0],
          passwordHash,
          role,
          createdAt: nowIso,
        };
        memoryUsers.set(emailLower, dbUser);
      }
    }

    // Check if user is blocked
    try {
      const { adminService } = await import("../admin/admin-service");
      if (adminService.isBlocked(dbUser.id, dbUser.email)) {
        throw new Error("Your account has been suspended by the administrator. Please contact support.");
      }
    } catch (e: any) {
      if (e.message?.includes("suspended")) throw e;
    }

    const activeSub = findActiveValidSubscription(dbUser.subscriptions);
    const isWithin7DaysOfSignup = dbUser.createdAt && (Date.now() - new Date(dbUser.createdAt).getTime() < 7 * 86400000);
    const isTrialActive = Boolean(activeSub?.status === "TRIALING" || (!activeSub && isWithin7DaysOfSignup && dbUser.role !== "ADMIN"));
    const isPremium = Boolean(activeSub || dbUser.role === "ADMIN" || isWithin7DaysOfSignup);
    const userTrialEnds = activeSub?.expiresAt ? new Date(activeSub.expiresAt).toISOString() : (isWithin7DaysOfSignup ? new Date(new Date(dbUser.createdAt).getTime() + 7 * 86400000).toISOString() : trialEndsAtIso);

    const user: AuthUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || dbUser.email.split("@")[0],
      role: dbUser.role,
      isPremium,
      subscriptionPlan: activeSub ? activeSub.plan : (dbUser.role === "ADMIN" ? "VIP_PRO" : (isTrialActive ? "7_DAY_TRIAL" : "FREE")),
      subscriptionStatus: activeSub ? activeSub.status : (dbUser.role === "ADMIN" ? "ACTIVE" : (isTrialActive ? "TRIALING" : "FREE")),
      trialEndsAt: userTrialEnds,
      createdAt: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString() : nowIso,
    };

    const sessionId = `sess_${Date.now()}`;
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    });

    await sessionService.createSession({
      userId: user.id,
      token,
      deviceName: deviceName || "Google Device",
      userAgent,
      ipAddress,
    });

    return { user, token };
  }

  async getCurrentUser(token?: string | null): Promise<AuthUser | null> {
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    const isSessionActive = await sessionService.validateSession(token);
    if (!isSessionActive) return null;

    let dbUser: any = null;
    await betBuilderCreditsService.ensureSchema();
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { subscriptions: true },
      });
    } catch {
      dbUser = memoryUsers.get(payload.email);
    }

    const { adminService } = await import("../admin/admin-service");
    const override = adminService.getUserOverride(payload.userId);

    const activeSub = findActiveValidSubscription(dbUser?.subscriptions);
    const isWithin7DaysOfSignup = dbUser?.createdAt && (Date.now() - new Date(dbUser.createdAt).getTime() < 7 * 86400000);
    const isTrialActive = Boolean(activeSub?.status === "TRIALING" || (!activeSub && isWithin7DaysOfSignup && payload.role !== "ADMIN"));
    const isPremium = payload.role === "ADMIN" || Boolean(activeSub) || Boolean(isWithin7DaysOfSignup) || Boolean(override?.tier && override.tier !== "FREE");
    const trialEndsAt = activeSub?.expiresAt ? new Date(activeSub.expiresAt).toISOString() : (isWithin7DaysOfSignup ? new Date(new Date(dbUser.createdAt).getTime() + 7 * 86400000).toISOString() : null);

    const subscriptionPlan = override?.tier || (activeSub ? activeSub.plan : (payload.role === "ADMIN" ? "VIP_PRO" : (isTrialActive ? "7_DAY_TRIAL" : "FREE")));
    const subscriptionStatus = override?.subscriptionStatus || (activeSub ? activeSub.status : (payload.role === "ADMIN" ? "ACTIVE" : (isTrialActive ? "TRIALING" : "FREE")));

    return {
      id: payload.userId,
      email: payload.email,
      name: dbUser?.name || payload.email.split("@")[0],
      role: payload.role,
      isPremium,
      subscriptionPlan,
      subscriptionStatus,
      trialEndsAt,
      createdAt: dbUser?.createdAt ? new Date(dbUser.createdAt).toISOString() : undefined,
    };
  }

  async updateProfile(userId: string, data: { name?: string }): Promise<AuthUser> {
    const { name } = data;
    let updated: any = null;
    try {
      updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
        },
        include: { subscriptions: true },
      });
    } catch {
      // Memory fallback
      for (const u of memoryUsers.values()) {
        if (u.id === userId) {
          if (name) u.name = name.trim();
          updated = u;
          break;
        }
      }
    }

    if (!updated) {
      throw new Error("User not found");
    }

    const activeSub = findActiveValidSubscription(updated.subscriptions);
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name || updated.email.split("@")[0],
      role: updated.role,
      isPremium: updated.role === "ADMIN" || Boolean(activeSub),
      subscriptionPlan: activeSub ? activeSub.plan : (updated.role === "ADMIN" ? "VIP_PRO" : "FREE"),
      subscriptionStatus: activeSub ? activeSub.status : "FREE",
      createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters");
    }

    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });
    } catch {
      for (const u of memoryUsers.values()) {
        if (u.id === userId) {
          dbUser = u;
          break;
        }
      }
    }

    if (!dbUser) {
      throw new Error("User not found");
    }

    const isValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    const newPasswordHash = await hashPassword(newPassword);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });
    } catch {
      dbUser.passwordHash = newPasswordHash;
    }

    return true;
  }
}

export const authService = new AuthService();
