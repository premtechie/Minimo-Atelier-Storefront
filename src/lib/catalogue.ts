import "server-only";
import { readFile } from "node:fs/promises";
import { ApiCatalogue, type ApiCatalogue as Catalogue } from "./types";
import { buildCatalogue, type Store } from "./store";

/**
 * The admin console that owns products, prices and stock. Only this site's
 * servers talk to it, with ADMIN_API_KEY; shoppers' browsers never see the
 * admin's address or the key (both are server-only environment variables).
 */
export const ADMIN_URL = (process.env.ADMIN_URL || "https://admin.minimoatelier.in").replace(/\/+$/, "");
const KEY_HEADER = "x-storefront-key";

/** How often a page asks the admin again (seconds). */
export const REVALIDATE = 60;

/** A call to the admin's storefront API, with the server-to-server key. */
export function adminFetch(path: string, init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {}) {
  const key = process.env.ADMIN_API_KEY;
  if (!key) throw new Error("ADMIN_API_KEY is not set");
  return fetch(`${ADMIN_URL}/api/v1/storefront${path}`, { ...init, headers: { ...init.headers, [KEY_HEADER]: key } });
}

async function fetchCatalogue(): Promise<Catalogue | null> {
  try {
    if (process.env.CATALOGUE_FIXTURE) {
      return ApiCatalogue.parse(JSON.parse(await readFile(process.env.CATALOGUE_FIXTURE, "utf8")));
    }
    // Cached on this site's servers for a minute (the admin never lets a CDN cache it).
    const res = await adminFetch("/catalogue", { next: { revalidate: REVALIDATE, tags: ["catalogue"] }, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`catalogue ${res.status}`);
    return ApiCatalogue.parse(await res.json());
  } catch (err) {
    // A shop page is better than an error page: it shows "back in a moment"
    // and the next request (at most a minute later) tries again.
    console.error("[minimo] catalogue unavailable:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Today's catalogue, grouped for the site; `ok` is false when the admin couldn't be reached. */
export async function getStore(): Promise<Store> {
  return buildCatalogue(await fetchCatalogue());
}
