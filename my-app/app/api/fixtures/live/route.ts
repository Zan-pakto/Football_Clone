import { NextRequest, NextResponse } from "next/server";
import { fixtureService } from "@/lib/football/fixture-service";
import { authService } from "@/lib/auth/auth-service";
import { accessControlService } from "@/lib/subscriptions/access-service";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    const user = await authService.getCurrentUser(token);

    const liveFixtures = await fixtureService.getLiveFixtures();
    const sanitized = accessControlService.filterFixturesList(liveFixtures, user);

    return NextResponse.json({
      success: true,
      count: sanitized.length,
      matches: sanitized,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
