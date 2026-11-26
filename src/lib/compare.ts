import type { CompareSite, PriceCheck } from "./types";

/*
 * "Compare prices" on the product page. What a shopper is told depends only
 * on what the hand check in the admin found, so nothing on the page is a claim
 * the shop can't back up (ASCI Code, chapter IV: like for like, factual,
 * provable, not misleading):
 *
 * - lowest: at least one site has the same item, every same-item listing is
 *   at or above our price, and all three sites were searched. "Lowest price we found".
 * - only: all three sites searched, the same item found on none. "Only at Minimo".
 * - why: anything else (a site is cheaper, the check is older than 30 days,
 *   a site wasn't searched, or no check at all). No price claim at all.
 */

export const SITES: CompareSite[] = ["amazon", "flipkart", "meesho"];
export const SITE_NAME: Record<CompareSite, string> = { amazon: "Amazon", flipkart: "Flipkart", meesho: "Meesho" };
/** A check older than this is not shown: prices online move. */
export const MAX_AGE_DAYS = 30;

export type Listing = { site: CompareSite; name: string; price: number; url: string; more: number };
export type Compare =
  | { state: "lowest"; checkedOn: string; price: number; listings: Listing[]; missing: CompareSite[]; saving: number; vs: Listing }
  | { state: "only"; checkedOn: string; price: number }
  | { state: "why"; price: number };

const DAY = 86_400_000;

/** Days from the check to today (whole days, UTC). */
export function ageDays(checkedOn: string, now: Date) {
  return Math.floor((now.getTime() - Date.parse(`${checkedOn}T00:00:00Z`)) / DAY);
}

export function compareFor(price: number, check: PriceCheck | null | undefined, now = new Date()): Compare {
  const why = { state: "why", price } as const;
  if (!check || !Number.isFinite(price) || price <= 0) return why;
  const age = ageDays(check.checked_on, now);
  if (!(age >= 0 && age <= MAX_AGE_DAYS)) return why;
  // Every site must have been searched, or "lowest we found" says too much.
  if (!SITES.every((s) => check.sites.some((x) => x.site === s))) return why;
  const listings: Listing[] = [];
  for (const s of check.sites) if (s.found) listings.push({ site: s.site, name: SITE_NAME[s.site], price: s.price, url: s.url, more: Math.round(s.price - price) });
  if (listings.length === 0) return { state: "only", checkedOn: check.checked_on, price };
  if (listings.some((l) => l.price < price)) return why;
  listings.sort((a, b) => a.price - b.price || SITES.indexOf(a.site) - SITES.indexOf(b.site));
  const missing = SITES.filter((s) => !listings.some((l) => l.site === s));
  // The saving is against the cheapest same-item listing, never the dearest.
  const vs = listings[0];
  return { state: "lowest", checkedOn: check.checked_on, price, listings, missing, saving: Math.round(vs.price - price), vs };
}

/** "2026-11-25" as "25 Nov 2026". */
export function checkedLabel(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** A short line for search snippets and ads, only for products that really are lowest. */
export function compareSnippet(c: Compare): string | null {
  if (c.state !== "lowest" || c.saving <= 0) return null;
  const month = new Date(`${c.checkedOn}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  return `₹${Math.round(c.price).toLocaleString("en-IN")} here, ₹${Math.round(c.vs.price).toLocaleString("en-IN")} for the same item on ${c.vs.name} (checked ${month}).`;
}
