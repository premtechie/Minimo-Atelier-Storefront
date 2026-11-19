import type { Container } from "./merch";

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
