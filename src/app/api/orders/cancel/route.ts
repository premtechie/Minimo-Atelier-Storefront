import type { NextRequest } from "next/server";
import { bad, readBody, relay } from "@/lib/orders-server";

// POST /api/orders/cancel {number, token} → cancels an order not yet paid.
export async function POST(req: NextRequest) {
  const b = await readBody(req);
  if (!b) return bad();
  return relay("/orders/cancel", { number: String(b.number ?? ""), token: String(b.token ?? "") });
}
