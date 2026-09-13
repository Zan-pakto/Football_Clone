import { Router, Request, Response } from "express";
import { fixtureService } from "../lib/football/fixture-service";
import { authService } from "../lib/auth/auth-service";
import { accessControlService } from "../lib/subscriptions/access-service";

const router = Router();

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
  const queryToken = req.query?.token as string | undefined;
  if (queryToken && queryToken !== "null" && queryToken !== "undefined" && queryToken.length > 10) {
    return queryToken;
  }
  return undefined;
}

// GET /api/fixtures/live
router.get("/live", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    const liveFixtures = await fixtureService.getLiveFixtures();
    const sanitized = accessControlService.filterFixturesList(liveFixtures, user);

    return res.json({
      success: true,
      count: sanitized.length,
      matches: sanitized,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fixtures/track-record
router.get("/track-record", async (_req: Request, res: Response) => {
  try {
    const data = await fixtureService.getSettledTrackRecord();
    return res.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fixtures
router.get("/", async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || (req.query.d as string) || "0";
    const country = (req.query.country as string) || undefined;
    const league = (req.query.league as string) || undefined;
    const status = (req.query.status as any) || undefined;
    const search = (req.query.search as string) || undefined;
    const isGrouped = req.query.grouped !== "false";

    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    if (isGrouped) {
      const groups = await fixtureService.getGroupedFixtures(date, { date, country, league, status, search });

      const sanitizedGroups = groups.map((g) => ({
        ...g,
        fixtures: accessControlService.filterFixturesList(g.fixtures, user),
      }));

      return res.json({
        success: true,
        date,
        groups: sanitizedGroups,
        totalMatches: sanitizedGroups.reduce((acc, g) => acc + g.fixtures.length, 0),
      });
    }

    const flatFixtures = await fixtureService.getFixtures(date, { date, country, league, status, search });
    const sanitizedFixtures = accessControlService.filterFixturesList(flatFixtures, user);

    return res.json({
      success: true,
      date,
      count: sanitizedFixtures.length,
      matches: sanitizedFixtures,
    });
  } catch (error: any) {
    console.error("GET /api/fixtures error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fixtures/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    const fixture = await fixtureService.getFixtureById(id);
    if (!fixture) {
      return res.status(404).json({ success: false, error: "Fixture not found" });
    }

    const sanitized = accessControlService.filterFixtureForUser(fixture, user, 0);

    return res.json({
      success: true,
      fixture: sanitized,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
