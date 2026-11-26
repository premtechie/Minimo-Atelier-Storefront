import { bulkRate } from "./merch";

/*
 * The cart lives in the shopper's browser (localStorage). Each line keeps the
 * SKUs it is made of, so the cart page re-prices every line from today's admin
 * catalogue before checkout: a price stored in the browser is never trusted.
 */

export type CartPart = { sku: string; qty: number };

export type CartLine = {
  key: string;
  kind: "product" | "pack" | "build";
  name: string;
  /** Price of one unit (a piece, or one bag/hamper), as last priced. */
  price: number;
  /** Pieces, or bags/hampers (one per guest). */
  qty: number;
  image: string | null;
  /** What one unit is made of. A product line is just itself. */
  parts: CartPart[];
  /** Name on the wish tag or the message on the card. */
  note?: string;
  /** Short description, such as the bag and the pieces. */
  detail?: string;
  /** For a pack, its id; for a build, the container key. */
  ref?: string;
  /** False for gifts that don't take the return-gift bulk discount (a single lamp). */
  bulk?: boolean;
  /** A gift hamper sold as one product: never earns free delivery. */
  hamper?: boolean;
};

export type PriceLookup = (sku: string) => { price: number; cap: number; name: string; mrp?: number | null } | undefined;

/** One unit's price from today's catalogue, or null when a part is gone. */
export function unitPrice(line: Pick<CartLine, "parts">, lookup: PriceLookup): number | null {
  let sum = 0;
  for (const p of line.parts) {
    const hit = lookup(p.sku);
    if (!hit) return null;
    sum += hit.price * p.qty;
  }
  return sum;
}

/** Bulk discount only applies to return gifts: packs, builds of many bags, or many of one piece. */
export const lineRate = (line: Pick<CartLine, "qty" | "bulk">) => (line.bulk === false ? 0 : bulkRate(line.qty));
export const lineTotal = (line: Pick<CartLine, "price" | "qty" | "bulk">) => line.price * line.qty * (1 - lineRate(line));

export function cartTotals(lines: CartLine[]) {
  const gross = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const total = lines.reduce((s, l) => s + lineTotal(l), 0);
  return { gross, discount: gross - total, total, count: lines.length };
}

/**
 * What the lines would cost at MRP: each part at its MRP where it has a real one
 * above today's price, else at today's price. Never below the cart's gross.
 */
export function mrpGross(lines: CartLine[], lookup: PriceLookup) {
  let sum = 0;
  for (const l of lines) {
    let unit = 0;
    for (const p of l.parts) {
      const hit = lookup(p.sku);
      if (!hit) {
        unit = l.price;
        break;
      }
      unit += (hit.mrp && hit.mrp > hit.price ? hit.mrp : hit.price) * p.qty;
    }
    sum += Math.max(unit, l.price) * l.qty;
  }
  return sum;
}

/** A single gift that counts towards free delivery: not a return gift, pack, build or hamper. */
export const freeDeliveryLine = (l: Pick<CartLine, "kind" | "bulk" | "hamper">) => l.kind === "product" && l.bulk === false && !l.hamper;

/**
 * Free courier delivery: only for carts made entirely of single gifts, once
 * their total (after any bulk discount, before coupons) reaches `from`.
 * `left` is what is still needed, or null when the cart can't earn it.
 */
export function freeDelivery(lines: CartLine[], total: number, from: number) {
  const ok = lines.length > 0 && lines.every(freeDeliveryLine);
  return { ok, reached: ok && total >= from, left: ok ? Math.max(0, from - total) : null };
}

/** Pieces of each SKU the whole cart needs, to check against stock. */
export function needBySku(lines: CartLine[]) {
  const need = new Map<string, number>();
  for (const l of lines) for (const p of l.parts) need.set(p.sku, (need.get(p.sku) ?? 0) + p.qty * l.qty);
  return need;
}

/** SKUs the cart needs more of than the shop has today. */
export function shortages(lines: CartLine[], lookup: PriceLookup) {
  const out: { sku: string; name: string; need: number; have: number }[] = [];
  for (const [sku, need] of needBySku(lines)) {
    const hit = lookup(sku);
    const have = hit ? hit.cap : 0;
    if (need > have) out.push({ sku, name: hit?.name ?? sku, need, have });
  }
  return out;
}

/** Adds a line, merging with an identical one (same parts and note). */
export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  const same = lines.find(
    (l) => l.kind === line.kind && l.ref === line.ref && (l.note ?? "") === (line.note ?? "") && JSON.stringify(l.parts) === JSON.stringify(line.parts),
  );
  if (same) return lines.map((l) => (l === same ? { ...l, qty: l.qty + line.qty } : l));
  return [...lines, line];
}


/** A coupon the admin said can be used: its offer, so the saving follows the cart as it changes. */
export type AppliedCoupon = { code: string; percent: number; cap: number; min_bill: number };

/** The admin's own rule (its lib/coupons/rules.ts): percent of the items, to the nearest rupee, up to the cap; nothing below the minimum. */
export function couponSaving(c: AppliedCoupon | null, items: number) {
  if (!c || items < c.min_bill) return 0;
  return Math.min(items, c.cap, Math.round((items * c.percent) / 100));
}
