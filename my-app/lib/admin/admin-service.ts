import { prisma } from "../db/prisma";
import { sessionService } from "../auth/session-service";

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isBlocked: boolean;
  tier: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL" | "VIP_PRO";
  subscriptionStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "TRIALING" | "NONE";
  subscriptionExpiresAt: string | null;
  createdAt: string;
  activeSessionsCount: number;
  lastActive: string;
}

// In-Memory Blocked Users Set
export const blockedUserIds = new Set<string>();
export const blockedEmails = new Set<string>();

// Dynamic overrides for runtime tier & status changes
const dynamicUserOverrides = new Map<string, Partial<AdminUserRecord>>();

export class AdminService {
  /**
   * Check if a user is blocked
   */
  isBlocked(userId: string, email?: string): boolean {
    if (blockedUserIds.has(userId)) return true;
    if (email && blockedEmails.has(email.toLowerCase().trim())) return true;
    const override = dynamicUserOverrides.get(userId);
    return override?.isBlocked ?? false;
  }

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<boolean> {
    blockedUserIds.add(userId);

    const override = dynamicUserOverrides.get(userId) || {};
    override.isBlocked = true;
    dynamicUserOverrides.set(userId, override);

    // Try updating user in DB if custom blocked field exists or revoke all sessions
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (dbUser?.email) {
        blockedEmails.add(dbUser.email.toLowerCase().trim());
      }
    } catch {
      // Ignore
    }

    // Immediately revoke all active user sessions
    try {
      const activeSessions = await sessionService.getUserSessions(userId);
      for (const s of activeSessions) {
        await sessionService.revokeSession(s.id, userId);
      }
    } catch (e) {
      console.error("Error revoking sessions for blocked user:", e);
    }

    return true;
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<boolean> {
    blockedUserIds.delete(userId);

    const override = dynamicUserOverrides.get(userId) || {};
    override.isBlocked = false;
    dynamicUserOverrides.set(userId, override);

    try {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (dbUser?.email) {
        blockedEmails.delete(dbUser.email.toLowerCase().trim());
      }
    } catch {
      // Ignore
    }

    return true;
  }

  /**
   * Update User Subscription Tier
   */
  async updateUserTier(userId: string, tier: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL" | "VIP_PRO"): Promise<boolean> {
    const isFree = tier === "FREE";
    const expiresAt = isFree
      ? null
      : tier === "PREMIUM_ANNUAL"
      ? new Date(Date.now() + 365 * 86400000).toISOString()
      : tier === "VIP_PRO"
      ? new Date(Date.now() + 365 * 2 * 86400000).toISOString()
      : new Date(Date.now() + 30 * 86400000).toISOString();

    const status = isFree ? "NONE" : "ACTIVE";

    // 1. Update in DB
    try {
      const existingSub = await prisma.subscription.findFirst({
        where: { userId },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            plan: tier,
            status: isFree ? ("CANCELLED" as any) : ("ACTIVE" as any),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        });
      } else if (!isFree) {
        await prisma.subscription.create({
          data: {
            userId,
            plan: tier,
            status: "ACTIVE",
            expiresAt: new Date(expiresAt!),
          },
        });
      }
    } catch {
      // DB offline fallback
    }

    // 2. Update dynamic runtime override
    const override = dynamicUserOverrides.get(userId) || {};
    override.tier = tier;
    override.subscriptionStatus = status;
    override.subscriptionExpiresAt = expiresAt;
    dynamicUserOverrides.set(userId, override);

    return true;
  }

  /**
   * Get all real users for admin with search & filter support
   */
  async getAllUsers(params?: {
    search?: string;
    tier?: string;
    status?: string;
  }): Promise<{
    users: AdminUserRecord[];
    stats: {
      totalUsers: number;
      freeTierUsers: number;
      subscribedUsers: number;
      blockedUsers: number;
    };
  }> {
    const usersMap = new Map<string, AdminUserRecord>();

    // 1. Query real DB users from PostgreSQL / Prisma
    try {
      const dbUsers = await prisma.user.findMany({
        include: {
          subscriptions: true,
          sessions: {
            where: { revokedAt: null, expiresAt: { gt: new Date() } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      for (const u of dbUsers) {
        const activeSub = u.subscriptions.find((s) => s.status === "ACTIVE");
        const override = dynamicUserOverrides.get(u.id);

        const tier = override?.tier || (activeSub
          ? (activeSub.plan as any)
          : u.role === "ADMIN"
          ? "VIP_PRO"
          : "FREE");

        const isBlocked = this.isBlocked(u.id, u.email);

        usersMap.set(u.id, {
          id: u.id,
          name: u.name || u.email.split("@")[0],
          email: u.email,
          role: u.role as any,
          isBlocked,
          tier,
          subscriptionStatus: override?.subscriptionStatus || (activeSub ? "ACTIVE" : (tier !== "FREE" ? "ACTIVE" : "NONE")),
          subscriptionExpiresAt: override?.subscriptionExpiresAt !== undefined
            ? override.subscriptionExpiresAt
            : activeSub?.expiresAt ? activeSub.expiresAt.toISOString() : null,
          createdAt: u.createdAt.toISOString(),
          activeSessionsCount: u.sessions.length,
          lastActive: u.sessions.length > 0 ? "Active today" : "Offline",
        });
      }
    } catch {
      // Prisma offline or table empty, proceed to memory users
    }

    // 2. Query real registered users from memory (created via register/login APIs)
    try {
      const { memoryUsers } = await import("../auth/auth-service");
      for (const [_, mu] of memoryUsers.entries()) {
        if (!usersMap.has(mu.id)) {
          const isBlocked = this.isBlocked(mu.id, mu.email);
          const override = dynamicUserOverrides.get(mu.id);
          const tier = override?.tier || (mu.role === "ADMIN" ? "VIP_PRO" : "FREE");

          usersMap.set(mu.id, {
            id: mu.id,
            name: mu.name || mu.email.split("@")[0],
            email: mu.email,
            role: mu.role,
            isBlocked,
            tier,
            subscriptionStatus: override?.subscriptionStatus || (tier !== "FREE" ? "ACTIVE" : "NONE"),
            subscriptionExpiresAt: override?.subscriptionExpiresAt || null,
            createdAt: mu.createdAt,
            activeSessionsCount: 1,
            lastActive: "Active today",
          });
        }
      }
    } catch {
      // Ignore
    }

    // 3. Ensure the current admin account is present if created
    if (usersMap.size === 0) {
      // If no users registered yet at all, ensure admin master record
      const adminEmail = "admin@jolloftips.com";
      const isBlocked = this.isBlocked("admin_master_001", adminEmail);
      usersMap.set("admin_master_001", {
        id: "admin_master_001",
        name: "Pro Administrator",
        email: adminEmail,
        role: "ADMIN",
        isBlocked,
        tier: "VIP_PRO",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() + 10 * 365 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        activeSessionsCount: 1,
        lastActive: "Just now",
      });
    }

    let allUsers = Array.from(usersMap.values());

    // Compute Overall Stats from real data
    const totalUsers = allUsers.length;
    const freeTierUsers = allUsers.filter((u) => u.tier === "FREE" && !u.isBlocked).length;
    const subscribedUsers = allUsers.filter((u) => u.tier !== "FREE" && !u.isBlocked).length;
    const blockedUsers = allUsers.filter((u) => u.isBlocked).length;

    // Apply Search Filter
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      allUsers = allUsers.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    // Apply Tier Filter
    if (params?.tier && params.tier !== "ALL") {
      if (params.tier === "FREE") {
        allUsers = allUsers.filter((u) => u.tier === "FREE");
      } else if (params.tier === "SUBSCRIBED") {
        allUsers = allUsers.filter((u) => u.tier !== "FREE");
      } else if (params.tier === "VIP") {
        allUsers = allUsers.filter((u) => u.tier === "VIP_PRO" || u.tier === "PREMIUM_ANNUAL");
      }
    }

    // Apply Status Filter
    if (params?.status && params.status !== "ALL") {
      if (params.status === "BLOCKED") {
        allUsers = allUsers.filter((u) => u.isBlocked);
      } else if (params.status === "ACTIVE") {
        allUsers = allUsers.filter((u) => !u.isBlocked);
      }
    }

    return {
      users: allUsers,
      stats: {
        totalUsers,
        freeTierUsers,
        subscribedUsers,
        blockedUsers,
      },
    };
  }
}

export const adminService = new AdminService();
