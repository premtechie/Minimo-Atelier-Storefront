/*
 * Website orders. An order is placed in the admin (Billing → Bills, sale type
 * "Website") through this site's server; the shopper's phone keeps only the
 * order number and a long random secret, which is the only way to read the
 * order back. Steps and dates on the order page are the shop's real progress:
 * awaiting payment → paid → packed → shipped (or picked up / delivered).
 */

export type Delivery = "pickup" | "flat" | "hyd" | "india";
export type OrderStatus = "ordered" | "paid" | "packed" | "shipped" | "cancelled";

/** What the admin returns for one of the shopper's own orders. */
export type Order = {
  number: string;
  placed_at: string;
  status: OrderStatus;
  /** Set when the shop confirms stock (admin "Confirm order"); older admins leave it out. */
  confirmed_at?: string | null;
  paid_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
  delivery: Delivery;
  address: { line: string; pin: string } | null;
  phone: string | null;
  courier: string | null;
  tracking_number: string | null;
  /** Where the parcel is, from Velocity, and a page to track it (absent on older admins). */
  tracking?: Tracking | null;
  lines: { name: string; qty: number; note: string | null; detail: string | null; sku: string | null; unit: number | null; total: number | null }[];
  gift_note: string | null;
  items_total: number;
  /** The coupon taken off the items (absent on older orders). */
  coupon?: { code: string; saving: number } | null;
  shipping: number;
  /** Courier speed the shopper chose and the promised date (absent on older orders). */
  ship_speed?: "express" | "standard" | null;
  ship_by?: string | null;
  total: number;
  refunded: number;
  can_cancel: boolean;
};

/** A shipped parcel: Velocity's live status and courier scans (newest first), and a page to follow it. */
export type Tracking = { url: string | null; status: string | null; events: { at: string | null; text: string; place: string | null }[] };

/** Kept on the shopper's phone: enough to read the order back, plus the cart's pictures. */
export type SavedOrder = { number: string; token: string; at: number; images?: (string | null)[]; order?: Order };

export const DELIVERY_NAME: Record<Delivery, string> = {
  pickup: "Pick up at our store",
  flat: "Free delivery to your flat",
  hyd: "Hyderabad delivery",
  india: "Pan-India courier",
};

const KEY = "minimo-orders";

export function newToken() {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function savedOrders(): SavedOrder[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((o) => o && typeof o.number === "string" && typeof o.token === "string") : [];
  } catch {
    return [];
  }
}

export function saveOrders(list: SavedOrder[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
  } catch {
    /* private mode: the order is still in the shop's admin */
  }
  window.dispatchEvent(new Event("mm:orders"));
}

export function rememberOrder(o: SavedOrder) {
  saveOrders([o, ...savedOrders().filter((x) => x.number !== o.number)]);
}

/** [key, title, detail when done, detail while waiting, icon, expected day offset] */
export type Step = { key: string; title: string; done: string; wait: string; icon: string; day: number; at: string | null };

const fmtPhone = (m: string) => `+91 ${m.slice(0, 5)} ${m.slice(5)}`;

/** The order's steps, from the shop's real progress. */
export function steps(o: Order): Step[] {
  const pick = o.delivery === "pickup";
  const s: Step[] = [
    { key: "placed", title: "Order placed", done: `We have your order and ${o.phone ? `updates go to ${fmtPhone(o.phone)}` : "it is saved on this phone"}.`, wait: "", icon: "bag", day: 0, at: o.placed_at },
    { key: "confirmed", title: "Order confirmed", done: "Every piece is in stock and set aside for you.", wait: "We check every piece is in stock, usually within a few hours.", icon: "check", day: 0, at: o.confirmed_at ?? o.paid_at },
    { key: "paid", title: "Payment received", done: `${inrPlain(o.total)} paid.`, wait: "We send you a secure UPI payment link once your order is confirmed.", icon: "tag", day: 0, at: o.paid_at },
    { key: "packed", title: "Packed & wrapped", done: o.gift_note ? "Wrapped, tagged and ready." : "Packed with a wish tag on every bag.", wait: "We pack and tag each bag by hand.", icon: "gift", day: 1, at: o.packed_at },
  ];
  if (pick) {
    s.push(
      { key: "ready", title: "Ready for pickup", done: "Come by the store inside Honer Vivantis. Show your order number.", wait: "We tell you the moment it is ready.", icon: "store", day: 2, at: o.packed_at },
      { key: "done", title: "Picked up", done: "Enjoy the party!", wait: "", icon: "heart", day: 2, at: o.shipped_at },
    );
  } else if (o.delivery === "flat") {
    s.push({ key: "done", title: "Delivered", done: "Delivered to your flat. Enjoy the party!", wait: "We bring it to your tower and flat.", icon: "heart", day: 2, at: o.shipped_at });
  } else {
    const live = o.tracking?.status;
    s.push({ key: "shipped", title: "Shipped", done: `Handed to ${o.courier || "the courier"}.${live ? ` ${live}.` : ""}`, wait: "You get a tracking number when it ships.", icon: "box", day: o.delivery === "hyd" ? 3 : 6, at: o.shipped_at });
  }
  return s;
}

/** Index of the step the order is on now. */
export function current(o: Order) {
  const s = steps(o);
  const last = s.length - 1;
  switch (o.status) {
    case "paid":
      return 2;
    case "packed":
      return o.delivery === "pickup" ? 4 : 3;
    case "shipped":
      return last;
    case "ordered":
      return o.confirmed_at ? 1 : 0;
    default:
      return 0;
  }
}

export const isDone = (o: Order) => o.status === "shipped";
export const isPast = (o: Order) => o.status === "cancelled" || isDone(o);

export function fmtDate(t: string | number, withTime = true) {
  const d = new Date(t);
  const opts = { timeZone: "Asia/Kolkata" } as const;
  return (
    d.toLocaleDateString("en-IN", { ...opts, weekday: "short", day: "numeric", month: "short" }) +
    (withTime ? ", " + d.toLocaleTimeString("en-IN", { ...opts, hour: "numeric", minute: "2-digit" }) : "")
  );
}
export function dayAfter(t: string | number, plus: number) {
  const d = new Date(t);
  d.setDate(d.getDate() + plus);
  return d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" });
}

/** [label, chip class] */
export function status(o: Order): [string, string] {
  if (o.status === "cancelled") return ["Cancelled", "is-cancel"];
  const s = steps(o);
  const k = current(o);
  if (k === s.length - 1) return [s[k].title, "is-done"];
  return [k === 0 ? "Waiting for confirmation" : s[k].title, "is-live"];
}

export function eta(o: Order) {
  const s = steps(o);
  const last = s[s.length - 1];
  const pick = o.delivery === "pickup";
  if (isDone(o)) return `${last.title} ${fmtDate(o.shipped_at || o.placed_at, false)}`;
  return `${pick ? "Ready by" : "Arrives by"} ${dayAfter(o.placed_at, pick ? 2 : last.day)}`;
}

function inrPlain(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
/** The page for one ordered line: the product by its SKU, else a pack by its name; null for a custom bag. */
export function lineHref(l: Pick<Order["lines"][number], "sku" | "name">, links: Record<string, string>): string | null {
  return (l.sku && links[l.sku.toUpperCase()]) || links[`name:${l.name.trim().toLowerCase()}`] || null;
}

export const pieces = (o: Order) => o.lines.reduce((t, l) => t + l.qty, 0);
export const prettyPhone = fmtPhone;
