import { NextRequest, NextResponse } from "next/server";
import { fixtureService } from "@/lib/football/fixture-service";
import { authService } from "@/lib/auth/auth-service";
import { accessControlService } from "@/lib/subscriptions/access-service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = request.cookies.get("auth_token")?.value;
    const user = await authService.getCurrentUser(token);

    const fixture = await fixtureService.getFixtureById(id);
    if (!fixture) {
      return NextResponse.json({ success: false, error: "Fixture not found" }, { status: 404 });
    }

    const sanitized = accessControlService.filterFixtureForUser(fixture, user, 0);

    return NextResponse.json({
      success: true,
      fixture: sanitized,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
