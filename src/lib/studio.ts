import { TOP_H, TOP_W, type Container, type TopView } from "./merch";

export type Mode = "rg" | "hm";

/** A build saved in the browser so families can compare a few combos. */
export type SavedBuild = {
  k: string;
  m: Mode;
  box: string;
  /** SKUs, one entry per piece. */
  items: string[];
  cap: number;
  name: string;
  who: string;
  fav: boolean;
  /** True when the shopper left out the name tag (return gifts). */
  noTag?: boolean;
  /** Hearted by whoever shared it with you. */
  sharedFav?: boolean;
  t: number;
};

export const CAPS: Record<Mode, number[]> = { rg: [99, 149, 199, 249], hm: [499, 999, 1499, 2499] };
export const MAX_ITEMS: Record<Mode, number> = { rg: 6, hm: 9 };
export const WHO: Record<Mode, string[]> = {
  rg: ["Little kids", "Girls", "Boys", "Mixed group", "Teens", "Classmates", "Office team"],
  hm: ["Wife", "Husband", "Girlfriend", "Boyfriend", "Mom", "Dad", "Sister", "Brother", "Best friend", "Colleague", "Boss", "Teacher", "Grandparent", "Kid", "New baby", "Couple"],
};
const HER = /^(Wife|Girlfriend|Mom|Sister|Grandparent|Girls)$/;
const HIM = /^(Husband|Boyfriend|Dad|Brother)$/;
const KID = /^(Kid|New baby|Little kids|Boys|Classmates)$/;

/** The tray tab that suits who the gift is for, if any. */
export function tabForWho(mode: Mode, who: string): string | null {
  if (!who) return null;
  if (mode === "hm") return HER.test(who) ? "For her" : HIM.test(who) ? "For him" : KID.test(who) ? "Kids" : null;
  return who === "Girls" ? "Accessories" : who === "Boys" ? "Toys" : null;
}

/** x: centre across the opening; w: the share of the opening this piece may use. */
export type Slot = { x: number; w: number; row: 0 | 1; rot: number };

/** Where n pieces sit in the opening: one row, or a back and a front row when it fills up. */
export function slots(n: number, c: Pick<Container, "ox" | "hamper">): Slot[] {
  const [a, b] = c.ox;
  const rows = c.hamper ? (n > 4 ? 2 : 1) : n > 3 ? 2 : 1;
  const back = rows === 2 ? Math.ceil(n / 2) : n;
  const front = n - back;
  const out: Slot[] = [];
  for (let i = 0; i < n; i++) {
    const inBack = i < back;
    const k = inBack ? i : i - back;
    const cnt = inBack ? back : front;
    const span = (b - a) * (inBack ? 1 : 0.86);
    const start = a + (b - a - span) / 2;
    const x = start + span * ((k + 0.5) / cnt);
    const seed = (i * 37 + n * 11) % 13;
    out.push({ x, w: span / cnt, row: rows === 2 && !inBack ? 1 : 0, rot: (seed - 6) * (c.hamper ? 0.7 : 1.1) });
  }
  return out;
}

/** Inline style for one piece inside the container. */
export function itemStyle(s: Slot, i: number, c: Pick<Container, "ih" | "hamper" | "rim" | "sink">, size = 1) {
  const h = c.ih * size * (c.hamper ? 0.8 : 1);
  const lift = s.row ? -0.02 : c.hamper ? 0.035 : 0.07;
  // A bag shows a good part of each piece above its rim, so it reads as
  // "in the bag" rather than hidden behind it (the box art keeps its depth).
  const sink = c.hamper ? c.sink : c.sink * 0.55;
  const bottom = 1 - c.rim - sink + lift;
  // Each piece keeps to its share of the opening, so a wide piece shrinks to
  // fit instead of spilling past the sides of the bag.
  const w = Math.min(s.w * (c.hamper ? 1.25 : 1.3), c.hamper ? 0.5 : 0.62);
  return {
    left: `${(s.x * 100).toFixed(2)}%`,
    bottom: `${(bottom * 100).toFixed(2)}%`,
    height: `${(h * 100).toFixed(2)}%`,
    width: `${(w * 100).toFixed(2)}%`,
    "--r": `${s.rot.toFixed(1)}deg`,
    zIndex: s.row ? 20 + i : 10 + i,
  } as React.CSSProperties;
}

/** Where one gift landed in an overhead pack, in photo pixels. */
export type Spot = { x: number; y: number; s: number; rot: number };

/** A small seeded random, so a gift lands in the same place every time it is drawn. */
function rand(seed: number) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Where the next gift lands on the pile, given the gifts already in the pack.
 * Like dropping things into a real bag: it falls into the emptiest part of the
 * opening, partly over what is there once it fills, and stays where it lands.
 */
export function topSpot(t: TopView, prev: Spot[], seed: number, max: number, size = 1): Spot {
  const { x, y, w, h } = t.area;
  const base = Math.min(t.size, Math.sqrt((w * h) / (max * 0.7)));
  const s = base * Math.min(1.25, Math.max(0.9, size / 0.8));
  const r = rand(seed);
  const cx = x + w / 2;
  const cy = y + h / 2;
  let best: Spot | null = null;
  let bestScore = Infinity;
  for (let k = 0; k < 24; k++) {
    // Keep the centre inside the opening; the edges may tuck under the rim.
    const px = x + s * 0.3 + r() * Math.max(1, w - s * 0.6);
    const py = y + s * 0.3 + r() * Math.max(1, h - s * 0.6);
    if (t.set === "potli" && ((px - cx) / (w / 2)) ** 2 + ((py - cy) / (h / 2)) ** 2 > 0.75) continue;
    let score = Math.hypot((px - cx) / w, (py - cy) / h) * s * 0.4;
    for (const q of prev) {
      const d = Math.hypot(px - q.x, py - q.y);
      const reach = (s + q.s) * 0.5;
      if (d < reach) score += (reach - d) ** 2 / reach;
    }
    if (score < bestScore) {
      bestScore = score;
      best = { x: px, y: py, s, rot: (r() - 0.5) * 44 };
    }
  }
  return best ?? { x: cx, y: cy, s, rot: 0 };
}

/** Inline style for a gift lying at a spot, in % of the photo. Later gifts lie on top. */
export function spotStyle(p: Spot, i: number) {
  return {
    left: `${((p.x / TOP_W) * 100).toFixed(2)}%`,
    bottom: `${(((TOP_H - p.y - p.s / 2) / TOP_H) * 100).toFixed(2)}%`,
    width: `${((p.s / TOP_W) * 100).toFixed(2)}%`,
    height: `${((p.s / TOP_H) * 100).toFixed(2)}%`,
    "--r": `${p.rot.toFixed(1)}deg`,
    zIndex: 10 + i,
  } as React.CSSProperties;
}

/* Share links carry the builds in the URL hash, so nothing is stored on a server. */
type Wire = [Mode, string, number, string[], string, 0 | 1];

function b64url(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeShare(list: SavedBuild[]) {
  const wire: Wire[] = list.map((b) => [b.m, b.box, b.cap, b.items, b.who, b.fav ? 1 : 0]);
  return b64url(JSON.stringify(wire));
}

export function decodeShare(code: string, known: (sku: string) => boolean, boxes: string[]): SavedBuild[] {
  try {
    const wire = JSON.parse(unb64url(code)) as Wire[];
    if (!Array.isArray(wire)) return [];
    return wire
      .slice(0, 12)
      .map((w, i): SavedBuild | null => {
        if (!Array.isArray(w)) return null;
        const [m, box, cap, items, who, fav] = w;
        if ((m !== "rg" && m !== "hm") || !boxes.includes(box) || !Array.isArray(items)) return null;
        const keep = items.filter((s) => typeof s === "string" && known(s)).slice(0, MAX_ITEMS[m]);
        if (!keep.length) return null;
        return {
          k: `s${i}-${Date.now().toString(36)}`,
          m,
          box,
          cap: Number.isFinite(cap) && cap > 0 ? Math.min(cap, 50000) : CAPS[m][0],
          items: keep,
          name: "",
          who: typeof who === "string" ? who.slice(0, 24) : "",
          fav: false,
          sharedFav: fav === 1,
          t: Date.now(),
        };
      })
      .filter((b): b is SavedBuild => !!b);
  } catch {
    return [];
  }
}

export const buildName = (b: Pick<SavedBuild, "m" | "who">, i: number) => `${b.m === "hm" ? "Hamper" : "Bag"} ${i + 1}${b.who ? ` for ${b.who}` : ""}`;
