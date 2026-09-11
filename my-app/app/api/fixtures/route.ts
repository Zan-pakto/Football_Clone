import { NextRequest, NextResponse } from "next/server";
import { fixtureService } from "@/lib/football/fixture-service";
import { authService } from "@/lib/auth/auth-service";
import { accessControlService } from "@/lib/subscriptions/access-service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || searchParams.get("d") || "0";
    const country = searchParams.get("country") || undefined;
    const league = searchParams.get("league") || undefined;
    const status = (searchParams.get("status") as any) || undefined;
    const search = searchParams.get("search") || undefined;
    const isGrouped = searchParams.get("grouped") !== "false";

    // Check user authentication for server-side paywall
    const token = request.cookies.get("auth_token")?.value;
    const user = await authService.getCurrentUser(token);

    if (isGrouped) {
      const groups = await fixtureService.getGroupedFixtures(date, { date, country, league, status, search });

      // Apply server-side paywall to all grouped fixtures
      const sanitizedGroups = groups.map((g) => ({
        ...g,
        fixtures: accessControlService.filterFixturesList(g.fixtures, user),
      }));

      return NextResponse.json({
        success: true,
        date,
        groups: sanitizedGroups,
        totalMatches: sanitizedGroups.reduce((acc, g) => acc + g.fixtures.length, 0),
      });
    }

    const flatFixtures = await fixtureService.getFixtures(date, { date, country, league, status, search });
    const sanitizedFixtures = accessControlService.filterFixturesList(flatFixtures, user);

    return NextResponse.json({
      success: true,
      date,
      count: sanitizedFixtures.length,
      matches: sanitizedFixtures,
    });
  } catch (error: any) {
    console.error("GET /api/fixtures error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
