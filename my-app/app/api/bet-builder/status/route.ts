import { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/backend-proxy";

export async function GET(req: NextRequest) {
  return forwardToBackend(req, "/api/bet-builder/status", "GET");
}

