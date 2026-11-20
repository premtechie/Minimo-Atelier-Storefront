import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { adminFetch } from "./catalogue";

/*
 * Website accounts, this site's side. The shopper's browser talks only to
 * these routes; the session secret lives in an httpOnly cookie the browser's
 * scripts can't read, and only this server passes it on to the admin (with
 * the server-to-server key). Like Bluebee, a sign-in lasts until the shopper
 * signs out: 60 days from their last visit.
 */

export const SESSION_COOKIE = "mm_session";
export const SESSION_DAYS = 60;
const NO_STORE = { "cache-control": "private, no-store" };

export const sessionOf = (req: NextRequest) => req.cookies.get(SESSION_COOKIE)?.value ?? "";

export function setSession(res: NextResponse, token: string, req: NextRequest) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}
export function clearSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

const unreachable = () => NextResponse.json({ error: { code: "unavailable", message: "We couldn't reach the shop just now. Please try again in a minute." } }, { status: 503, headers: NO_STORE });

/** Calls the admin and returns its status and body, or null when it can't be reached. */
export async function callAdmin(path: string, body?: unknown): Promise<{ status: number; data: Record<string, unknown> } | null> {
  try {
    const res = await adminFetch(path, {
      method: body === undefined ? "GET" : "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, data };
  } catch (e) {
    console.error("[minimo] account call failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Passes the admin's reply on: its own wording for shopper mistakes, a plain line for anything else. */
export function passOn(out: { status: number; data: Record<string, unknown> } | null) {
  if (!out) return unreachable();
  if (out.status >= 500 && out.status !== 502 && out.status !== 503) return unreachable();
  return NextResponse.json(out.data, { status: out.status, headers: NO_STORE });
}

/** "Chrome on iPhone": enough for the shop to tell a customer's browsers apart. */
export function deviceName(ua: string) {
  const browser = /Edg\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}
