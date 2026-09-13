import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");

    const headers: Record<string, string> = {};
    if (authHeader && !authHeader.includes("null") && !authHeader.includes("undefined") && authHeader.length > 15) {
      headers["authorization"] = authHeader;
    }
    if (cookieHeader) headers["cookie"] = cookieHeader;

    const res = await fetch(`${BACKEND_URL}/api/payments/subscription-status`, {
      method: "GET",
      headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
