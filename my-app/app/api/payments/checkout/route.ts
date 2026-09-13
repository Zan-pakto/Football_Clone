import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader && !authHeader.includes("null") && !authHeader.includes("undefined") && authHeader.length > 15) {
      headers["authorization"] = authHeader;
    }
    if (cookieHeader) headers["cookie"] = cookieHeader;

    const res = await fetch(`${BACKEND_URL}/api/payments/checkout`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize checkout" },
      { status: 500 }
    );
  }
}
