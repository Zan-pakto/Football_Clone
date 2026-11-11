import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

export async function forwardToBackend(
  req: NextRequest,
  path: string,
  method: "GET" | "POST" = "GET"
) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");

    const headers: Record<string, string> = {};
    if (
      authHeader &&
      !authHeader.includes("null") &&
      !authHeader.includes("undefined") &&
      authHeader.length > 15
    ) {
      headers["authorization"] = authHeader;
    }
    if (cookieHeader) headers["cookie"] = cookieHeader;
    if (method === "POST") {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      cache: "no-store",
      ...(method === "POST" ? { body: await req.text() } : {}),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Backend request failed" },
      { status: 500 }
    );
  }
}

