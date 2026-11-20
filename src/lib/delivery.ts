/*
 * Courier prices for the shopper: the pincode box on product pages and the
 * delivery step of checkout. Prices come from Velocity Shipping through the
 * admin (POST /api/shipping/quote); this file only asks and reads the answer.
 */

export type Speed = "express" | "standard";
export type ShipOption = { speed: Speed; price: number; by: string | null };
export type Quote =
  | { available: true; pin: string; standard: ShipOption | null; express: ShipOption | null }
  | { available: false; pin: string; reason: "not_configured" | "not_serviceable" | "unavailable" };

export type Piece = { sku: string; qty: number };

export const isPin = (pin: string) => /^[1-9]\d{5}$/.test(pin);

const cache = new Map<string, Promise<Quote>>();

/** Asks for prices; a failed request answers "unavailable" so the page can fall back to plain wording. */
export function fetchQuote(pin: string, pieces: Piece[]): Promise<Quote> {
  const k = `${pin}|${pieces.map((p) => `${p.sku}x${p.qty}`).join(",")}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const p = fetch("/api/shipping/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pin, pieces }),
  })
    .then(async (r) => {
      const data = (await r.json().catch(() => ({}))) as { quote?: Quote };
      if (!r.ok || !data.quote) throw new Error(String(r.status));
      return data.quote;
    })
    .catch((): Quote => {
      cache.delete(k);
      return { available: false, pin, reason: "unavailable" };
    });
  cache.set(k, p);
  return p;
}

const PIN_KEY = "mm-pin";
/** The last pincode the shopper checked, remembered on this phone. */
export function savedPin(): string {
  try {
    const v = localStorage.getItem(PIN_KEY) ?? "";
    return isPin(v) ? v : "";
  } catch {
    return "";
  }
}
export function savePin(pin: string) {
  try {
    localStorage.setItem(PIN_KEY, pin);
  } catch {
    /* private mode: nothing to remember */
  }
}

/** "Wed, 25 Nov" for a YYYY-MM-DD date. */
export function shortDate(iso: string | null): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return new Date(`${iso}T12:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

/** Whole days from today (IST) to `iso`, at least 1. */
export function daysUntil(iso: string | null, now = new Date()): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const ms = Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.max(1, Math.round(ms / 86_400_000)) : null;
}

/**
 * How long delivery takes, as the shopper reads it: "3 days" from the
 * courier's date, or a usual range when the courier gave none.
 */
export function etaText(o: { speed: Speed; by: string | null }, pin: string, now = new Date()): string {
  const n = daysUntil(o.by, now);
  if (n !== null) return n === 1 ? "1 day" : `${n} days`;
  if (pin.startsWith("500")) return "2–3 days";
  return o.speed === "express" ? "3–5 days" : "4–7 days";
}

export const SPEED_NAME: Record<Speed, string> = { express: "Express", standard: "Standard" };
