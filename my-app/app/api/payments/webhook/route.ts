import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const forwardHeaders = [
      "webhook-id",
      "webhook-timestamp",
      "webhook-signature",
      "whop-signature",
      "stripe-signature",
    ];

    for (const h of forwardHeaders) {
      const val = req.headers.get(h);
      if (val) {
        headers[h] = val;
      }
    }

    const res = await fetch(`${BACKEND_URL}/api/payments/webhook`, {
      method: "POST",
      headers,
      body: rawBody,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { received: false, error: error.message || "Webhook relay failed" },
      { status: 500 }
    );
  }
}
