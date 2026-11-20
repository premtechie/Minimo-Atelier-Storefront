import { NextResponse, type NextRequest } from "next/server";
import { bad, readBody, relay, tooMany } from "@/lib/orders-server";

// POST /api/shipping/quote {pin, pieces: [{sku, qty}]} → Express and Standard
// courier prices and dates to that pincode. The admin asks Velocity Shipping
// with the shop's own key and the pieces' weights; only SKUs and counts go.
export async function POST(req: NextRequest) {
  if (tooMany(req, 40, 10 * 60_000, "quote")) return NextResponse.json({ error: { code: "slow_down", message: "Too many checks from here. Please wait a few minutes." } }, { status: 429 });
  const b = await readBody(req);
  if (!b) return bad();
  const pin = typeof b.pin === "string" ? b.pin.replace(/\s/g, "") : "";
  if (!/^[1-9]\d{5}$/.test(pin)) return bad("Enter a 6-digit pincode.");
  return relay("/shipping/quote", { pin, pieces: Array.isArray(b.pieces) ? b.pieces.slice(0, 60) : [] });
}
