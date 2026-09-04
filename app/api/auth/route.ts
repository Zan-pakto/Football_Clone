import { NextRequest, NextResponse } from "next/server";
import { NerdyTipsAuthManager } from "@/lib/scraper/auth";

export async function GET() {
  try {
    const status = NerdyTipsAuthManager.getStatus();
    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check auth status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password, cookie } = body || {};

    if (action === "login") {
      if (!username || !password) {
        return NextResponse.json(
          { success: false, error: "Username and password are required" },
          { status: 400 }
        );
      }
      const sessionCookie = await NerdyTipsAuthManager.performLogin(username, password);
      if (sessionCookie) {
        return NextResponse.json({
          success: true,
          message: "Login successful. Session acquired.",
          ...NerdyTipsAuthManager.getStatus(),
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Login failed on NerdyTips. Please verify your credentials or check if device limit was reached.",
          },
          { status: 401 }
        );
      }
    }

    if (action === "cookie") {
      if (!cookie || typeof cookie !== "string" || !cookie.trim()) {
        return NextResponse.json(
          { success: false, error: "Cookie string is required" },
          { status: 400 }
        );
      }
      NerdyTipsAuthManager.setCookie(cookie.trim());
      return NextResponse.json({
        success: true,
        message: "Session cookie updated successfully.",
        ...NerdyTipsAuthManager.getStatus(),
      });
    }

    if (action === "logout") {
      await NerdyTipsAuthManager.logout();
      return NextResponse.json({
        success: true,
        message: "Logged out successfully.",
        ...NerdyTipsAuthManager.getStatus(),
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use 'login', 'logout', or 'cookie'." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API Auth Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Auth action failed" },
      { status: 500 }
    );
  }
}
