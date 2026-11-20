import { NextResponse, type NextRequest } from "next/server";
import { callAdmin, clearSession, passOn, sessionOf } from "@/lib/account-server";
import { readBody } from "@/lib/orders-server";

const ACTIONS = new Set(["overview", "profile", "address-save", "address-remove", "wishlist", "orders", "order", "order-cancel"]);

// POST /api/account/<action> → the signed-in shopper's account (see the admin's
// /storefront/account API). The session comes from this browser's cookie.
export async function POST(req: NextRequest, ctx: RouteContext<"/api/account/[action]">) {
  const { action } = await ctx.params;
  if (!ACTIONS.has(action)) return NextResponse.json({ error: { code: "not_found", message: "Not found." } }, { status: 404 });
  const session = sessionOf(req);
  if (!session) return NextResponse.json({ error: { code: "signed_out", message: "Please sign in again." } }, { status: 401 });
  const body = (await readBody(req)) ?? {};
  const out = await callAdmin(`/account/${action}`, { ...body, session });
  if (out?.status === 401) return clearSession(passOn(out));
  return passOn(out);
}
