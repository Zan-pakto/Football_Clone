import { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/backend-proxy";

export async function GET(req: NextRequest) {
  return forwardToBackend(req, "/api/payments/credit-packs", "GET");
}

