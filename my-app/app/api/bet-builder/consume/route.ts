import { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/backend-proxy";

export async function POST(req: NextRequest) {
  return forwardToBackend(req, "/api/bet-builder/consume", "POST");
}

