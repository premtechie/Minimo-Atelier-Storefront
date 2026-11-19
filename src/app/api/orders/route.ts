import { NextResponse, type NextRequest } from "next/server";
import { bad, readBody, relay, tooMany } from "@/lib/orders-server";

// POST /api/orders → places the shopper's order in the shop's admin.
// Prices are worked out there from the catalogue; only SKUs and counts go.
export async function POST(req: NextRequest) {
  if (tooMany(req)) return NextResponse.json({ error: { code: "slow_down", message: "Too many orders from here. Please wait a few minutes." } }, { status: 429 });
  const b = await readBody(req);
  if (!b) return bad();
  const { token, lines, delivery, address, pin, phone, gift_note, coupon } = b;
  return relay("/orders", { token, lines, delivery, address, pin, phone, gift_note, coupon });
}
