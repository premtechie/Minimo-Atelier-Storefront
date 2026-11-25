import { NextResponse, type NextRequest } from "next/server";
import { callAdmin, clearSession, passOn, sessionOf } from "@/lib/account-server";
import { adminFetch } from "@/lib/catalogue";
import { bad, tooMany } from "@/lib/orders-server";
import { fetchReviews } from "@/lib/reviews-server";

const NO_STORE = { "cache-control": "private, no-store" };
const SKU_RE = /^[A-Za-z]{3,5}-\d{1,6}$/;
const busy = () => NextResponse.json({ error: { code: "rate_limited", message: "Too many tries just now. Please wait a few minutes." } }, { status: 429, headers: NO_STORE });

/** A JSON body up to `max` characters, or null. Photos come as data URLs, so that route allows more. */
async function body(req: NextRequest, max: number) {
  try {
    const text = await req.text();
    if (text.length > max) return null;
    const v = JSON.parse(text);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// GET /api/reviews/list?sku=…&page=&photos=1&sort= → a page of the product's published reviews.
// GET /api/reviews/my-photo?id=… → one of the signed-in shopper's own photos (for their edit form).
export async function GET(req: NextRequest, ctx: RouteContext<"/api/reviews/[action]">) {
  const { action } = await ctx.params;
  const q = req.nextUrl.searchParams;
  if (action === "list") {
    const sku = q.get("sku") ?? "";
    if (!SKU_RE.test(sku)) return bad();
    const sort = q.get("sort");
    const out = await fetchReviews(sku.toUpperCase(), { page: Number(q.get("page")) || 1, photos: q.get("photos") === "1", sort: sort === "highest" || sort === "lowest" ? sort : "newest" });
    if (!out) return NextResponse.json({ error: { code: "unavailable", message: "Reviews couldn't load just now." } }, { status: 503, headers: NO_STORE });
    return NextResponse.json(out, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
  }
  if (action === "my-photo") {
    const session = sessionOf(req);
    const id = (q.get("id") ?? "").toLowerCase();
    if (!session || !/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
    try {
      const res = await adminFetch("/reviews/my-photo", { method: "POST", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify({ session, id }) });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !/^image\/(webp|jpeg)$/.test(type)) return new Response("Not found", { status: 404 });
      return new Response(await res.arrayBuffer(), { headers: { "content-type": type, ...NO_STORE, "x-content-type-options": "nosniff" } });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }
  return NextResponse.json({ error: { code: "not_found", message: "Not found." } }, { status: 404 });
}

// POST /api/reviews/eligibility {sku} → what Write a review opens (sign in, not bought, the form).
// POST /api/reviews/save {sku, rating, title, body, keep_photos?} → the shopper's review, waiting for approval.
// POST /api/reviews/photo {sku, data} → adds one photo, already shrunk on the shopper's phone.
export async function POST(req: NextRequest, ctx: RouteContext<"/api/reviews/[action]">) {
  const { action } = await ctx.params;
  if (action !== "eligibility" && action !== "save" && action !== "photo") return NextResponse.json({ error: { code: "not_found", message: "Not found." } }, { status: 404 });
  const input = await body(req, action === "photo" ? 2_200_000 : 16_000);
  if (!input || typeof input.sku !== "string" || !SKU_RE.test(input.sku)) return bad();
  const session = sessionOf(req);
  if (action === "eligibility") {
    if (tooMany(req, 120, 10 * 60_000, "review-check")) return busy();
    const out = await callAdmin("/reviews/eligibility", { session: session || undefined, sku: input.sku });
    return passOn(out);
  }
  if (!session) return NextResponse.json({ error: { code: "signed_out", message: "Please sign in again." } }, { status: 401, headers: NO_STORE });
  // Per network address, on top of the admin's per-shopper daily limits.
  if (action === "save" ? tooMany(req, 20, 60 * 60_000, "review-save") : tooMany(req, 40, 60 * 60_000, "review-photo")) return busy();
  const payload =
    action === "save"
      ? { session, sku: input.sku, rating: input.rating, title: input.title, body: input.body, keep_photos: input.keep_photos }
      : { session, sku: input.sku, data: input.data };
  const out = await callAdmin(`/reviews/${action}`, payload);
  if (out?.status === 401) return clearSession(passOn(out));
  return passOn(out);
}
