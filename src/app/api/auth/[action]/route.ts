import { NextResponse, type NextRequest } from "next/server";
import { callAdmin, clearSession, deviceName, passOn, sessionOf, setSession } from "@/lib/account-server";
import { bad, readBody, tooMany } from "@/lib/orders-server";

const NO_STORE = { "cache-control": "private, no-store" };

// GET  /api/auth/config  → whether sign-in is on (and so whether checkout needs it)
// GET  /api/auth/me      → { account } for this browser, or { account: null }
// POST /api/auth/otp     {phone}        → sends a 4-digit code
// POST /api/auth/verify  {phone, code}  → signs in; the session goes in an httpOnly cookie
// POST /api/auth/logout                 → signs this browser out
export async function GET(req: NextRequest, ctx: RouteContext<"/api/auth/[action]">) {
  const { action } = await ctx.params;
  if (action === "config") {
    const out = await callAdmin("/auth/config");
    if (!out || out.status !== 200) return NextResponse.json({ available: false, test_mode: false, otp_digits: 4, resend_seconds: 30 }, { headers: NO_STORE });
    return NextResponse.json(out.data, { headers: NO_STORE });
  }
  if (action === "me") {
    const session = sessionOf(req);
    if (!session) return NextResponse.json({ account: null }, { headers: NO_STORE });
    const out = await callAdmin("/auth/me", { session });
    if (!out) return passOn(out);
    if (out.status === 401) return clearSession(NextResponse.json({ account: null }, { headers: NO_STORE }));
    return passOn(out);
  }
  return NextResponse.json({ error: { code: "not_found", message: "Not found." } }, { status: 404 });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/auth/[action]">) {
  const { action } = await ctx.params;
  if (action === "logout") {
    const session = sessionOf(req);
    if (session) await callAdmin("/auth/logout", { session });
    return clearSession(NextResponse.json({ ok: true }, { headers: NO_STORE }));
  }
  if (action !== "otp" && action !== "verify") return NextResponse.json({ error: { code: "not_found", message: "Not found." } }, { status: 404 });
  if (tooMany(req, action === "otp" ? 10 : 30)) return NextResponse.json({ error: { code: "slow_down", message: "Too many tries from here. Please wait a few minutes." } }, { status: 429 });
  const b = await readBody(req);
  if (!b) return bad();
  if (action === "otp") return passOn(await callAdmin("/auth/otp", { phone: String(b.phone ?? "") }));
  const out = await callAdmin("/auth/verify", { phone: String(b.phone ?? ""), code: String(b.code ?? ""), device: deviceName(req.headers.get("user-agent") ?? "") });
  if (!out || out.status !== 200) return passOn(out);
  const { session, account, created } = out.data as { session: string; account: unknown; created: boolean };
  return setSession(NextResponse.json({ account, created }, { headers: NO_STORE }), session, req);
}
