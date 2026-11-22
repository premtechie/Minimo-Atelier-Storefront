import { NextResponse, type NextRequest } from "next/server";
import { bad, readBody, relay, tooMany } from "@/lib/orders-server";

// POST /api/coupons/check {code, amount} → whether the coupon can be used and
// what it takes off an items total of `amount` rupees. The admin answers with
// the offer only. A light brake per visitor stops anyone guessing codes; the
// order itself checks and spends the coupon again on the shop's own prices.
export async function POST(req: NextRequest) {
  if (tooMany(req, 15, 10 * 60_000, "coupon")) return NextResponse.json({ error: { code: "slow_down", message: "Too many tries from here. Please wait a few minutes." } }, { status: 429 });
  const b = await readBody(req);
  if (!b) return bad();
  const code = typeof b.code === "string" ? b.code.trim().slice(0, 30) : "";
  if (!code) return bad("Enter a coupon code.");
  const amount = Number(b.amount);
  return relay("/coupons/check", { code, amount: Number.isFinite(amount) && amount > 0 ? amount : 0 });
}
