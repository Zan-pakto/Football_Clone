import { prisma } from "../db/prisma";

export interface DeviceSession {
  id: string;
  userId: string;
  token: string;
  deviceName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
}

const MAX_SESSIONS = 5;

// Memory session fallback
const memorySessions = new Map<string, DeviceSession>();

export class SessionService {
  /**
   * Create a new session enforcing max 5 devices limit
   */
  async createSession(params: {
    userId: string;
    token: string;
    deviceName?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<DeviceSession> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sessionData: DeviceSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: params.userId,
      token: params.token,
      deviceName: params.deviceName || "Web Browser",
      userAgent: params.userAgent || "Unknown Browser",
      ipAddress: params.ipAddress || "127.0.0.1",
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt,
      revokedAt: null,
    };

    try {
      // 1. Check existing active sessions count
      const activeSessions = await prisma.session.findMany({
        where: {
          userId: params.userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastUsedAt: "asc" },
      });

      // 2. If >= 5 active sessions, revoke the oldest inactive session
      if (activeSessions.length >= MAX_SESSIONS) {
        const excessCount = activeSessions.length - MAX_SESSIONS + 1;
        const toRevoke = activeSessions.slice(0, excessCount);
        for (const s of toRevoke) {
          await prisma.session.update({
            where: { id: s.id },
            data: { revokedAt: new Date() },
          });
        }
      }

      // 3. Insert new session
      const created = await prisma.session.create({
        data: {
          userId: params.userId,
          token: params.token,
          deviceName: sessionData.deviceName,
          userAgent: sessionData.userAgent,
          ipAddress: sessionData.ipAddress,
          expiresAt,
        },
      });

      sessionData.id = created.id;
    } catch {
      // Fallback to in-memory session tracking
      const userActive = Array.from(memorySessions.values()).filter(
        (s) => s.userId === params.userId && !s.revokedAt && s.expiresAt > new Date()
      );
      if (userActive.length >= MAX_SESSIONS) {
        userActive.sort((a, b) => a.lastUsedAt.getTime() - b.lastUsedAt.getTime());
        userActive[0].revokedAt = new Date();
      }
      memorySessions.set(sessionData.id, sessionData);
    }

    return sessionData;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<DeviceSession[]> {
    try {
      const dbSessions = await prisma.session.findMany({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastUsedAt: "desc" },
      });
      return dbSessions;
    } catch {
      return Array.from(memorySessions.values()).filter(
        (s) => s.userId === userId && !s.revokedAt && s.expiresAt > new Date()
      );
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      await prisma.session.updateMany({
        where: { id: sessionId, userId },
        data: { revokedAt: new Date() },
      });
      const mem = memorySessions.get(sessionId);
      if (mem && mem.userId === userId) mem.revokedAt = new Date();
      return true;
    } catch {
      const mem = memorySessions.get(sessionId);
      if (mem && mem.userId === userId) {
        mem.revokedAt = new Date();
        return true;
      }
      return false;
    }
  }

  /**
   * Validate if a session is currently active and unrevoked
   */
  async validateSession(token: string): Promise<boolean> {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
      });
      if (session) {
        if (session.revokedAt || session.expiresAt < new Date()) {
          return false;
        }
        // Update lastUsedAt asynchronously
        prisma.session.update({
          where: { id: session.id },
          data: { lastUsedAt: new Date() },
        }).catch(() => {});
        return true;
      }
    } catch {
      // Prisma error, fallback to memory
    }

    // Fallback to in-memory session tracking
    const mem = Array.from(memorySessions.values()).find((s) => s.token === token);
    if (!mem || mem.revokedAt || mem.expiresAt < new Date()) return false;
    mem.lastUsedAt = new Date();
    return true;
  }
}

export const sessionService = new SessionService();
