import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { adminFetch } from "./catalogue";

/*
 * This site's side of website orders: the shopper's browser calls these
 * routes, and only this server calls the admin, with its key. Replies are
 * never cached, and nothing but the shopper's own order passes through.
 */

const hits = new Map<string, number[]>();
/** A light per-visitor brake on placing orders, or on another action named by `bucket` (best effort, per server). */
export function tooMany(req: NextRequest, limit = 8, windowMs = 10 * 60_000, bucket = "orders") {
  const ip = `${bucket}:${(req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local"}`;
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > limit;
}

const NO_STORE = { "cache-control": "private, no-store" };

export async function relay(path: string, body: unknown) {
  try {
    const res = await adminFetch(path, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (data as { error?: { code?: string; message?: string } }).error;
      // The admin's own wording is written for shoppers; anything else gets a plain line.
      const known = res.status === 409 || res.status === 422 || res.status === 404;
      return NextResponse.json(
        { error: { code: err?.code ?? "unavailable", message: known && err?.message ? err.message : "We couldn't reach the shop just now. Please try again in a minute." } },
        { status: known ? res.status : 503, headers: NO_STORE },
      );
    }
    return NextResponse.json(data, { status: res.status, headers: NO_STORE });
  } catch (e) {
    console.error("[minimo] orders unavailable:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: { code: "unavailable", message: "We couldn't reach the shop just now. Please try again in a minute." } }, { status: 503, headers: NO_STORE });
  }
}

export async function readBody(req: NextRequest) {
  try {
    const text = await req.text();
    if (text.length > 64_000) return null;
    const v = JSON.parse(text);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const bad = (message = "Something in this request isn't right.") => NextResponse.json({ error: { code: "bad_request", message } }, { status: 400, headers: NO_STORE });
