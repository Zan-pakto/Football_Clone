import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/auth-service";
import { sessionService } from "@/lib/auth/session-service";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    const user = await authService.getCurrentUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sessionService.getUserSessions(user.id);
    return NextResponse.json({
      success: true,
      sessions,
      maxAllowed: 5,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    const user = await authService.getCurrentUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { action, sessionId } = await request.json();
    if (action === "revoke" && sessionId) {
      await sessionService.revokeSession(sessionId, user.id);
      return NextResponse.json({ success: true, message: "Session revoked successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
