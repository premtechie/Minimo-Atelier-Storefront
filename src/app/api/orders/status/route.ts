import type { NextRequest } from "next/server";
import { bad, readBody, relay } from "@/lib/orders-server";

// POST /api/orders/status {orders: [{number, token}]} → the shopper's own orders.
export async function POST(req: NextRequest) {
  const b = await readBody(req);
  if (!b || !Array.isArray(b.orders) || b.orders.length > 30) return bad();
  const orders = (b.orders as { number?: unknown; token?: unknown }[]).map((o) => ({ number: String(o?.number ?? ""), token: String(o?.token ?? "") }));
  return relay("/orders/status", { orders });
}
