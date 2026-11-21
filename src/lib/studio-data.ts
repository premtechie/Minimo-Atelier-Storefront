import { BAG_SLUGS, CONTAINERS, PACKS, PHOTO_BAG, RG_TABS, type Container } from "./merch";
import { featured, stockCap, type Store } from "./store";
import type { Product } from "./types";
import type { Mode } from "./studio";

/*
 * What the gift studio needs from the catalogue, worked out on the server so
 * the browser only gets names, prices, stock caps and pictures: the same
 * public fields the rest of the site shows.
 */

export type StudioBox = Omit<Container, "match"> & { sku: string; price: number; cap: number | null; /** Picture for a photo bag. */ img?: string };
export type StudioPiece = {
  sku: string;
  name: string;
  price: number;
  /** Pieces the shop can sell today, or null when plenty. */
  cap: number | null;
  img: string;
  /** True for a transparent cut-out; false for a photo or sample picture. */
  cut: boolean;
  /** Relative height inside the bag (1 = default). */
  size: number;
};
export type StudioTab = { name: string; items: StudioPiece[] };
export type StudioData = {
  boxes: StudioBox[];
  tabs: Record<Mode, StudioTab[]>;
  /** The wish tag that goes on every return-gift bag. */
  tag: { sku: string; price: number; cap: number | null } | null;
};
export type StudioStart = { mode: Mode; box?: string; items?: string[]; /** Pieces the start needs that aren't in a tray. */ extra?: StudioPiece[] };

/** How big each cut-out sits inside the bag, matched to the drawings. */
const SIZE: Record<string, number> = {
  m1: 0.62, m2: 0.5, m3: 0.78, m4: 0.62, m5: 0.6, m6: 0.62, m7: 0.55, m8: 0.6, m9: 0.55, f2: 1.1, f3: 1.05, f4: 0.62,
  f5: 0.62, f6: 1.05, f7: 0.95, f8: 1, f9: 1, f11: 0.7, t1: 0.66, t2: 0.66, t3: 0.95, t4: 1.1, t5: 0.78, k1: 0.8, p1: 0.66,
  h1: 0.82, h2: 0.64, x1: 1.1, x2: 1.02, x3: 0.82, x4: 0.82, x5: 0.62, x6: 1.05, x7: 1.05, e1: 0.6, e4: 0.62, e6: 0.72,
  e7: 0.8, e8: 0.86, e12: 0.7,
};
const PER_TAB = 48;
const capOf = (p: Product) => {
  const c = stockCap(p);
  return Number.isFinite(c) ? c : null;
};

export function toPiece(p: Product): StudioPiece | null {
  const img = p.cutout ? `/art/studio/${p.cutout}.webp` : p.photoUrl ?? p.art;
  if (!img) return null;
  return { sku: p.sku, name: p.name, price: p.price, cap: capOf(p), img, cut: !!p.cutout, size: (p.cutout && SIZE[p.cutout]) || 0.8 };
}

function tab(name: string, list: Product[]): StudioTab | null {
  // Cut-outs first: they sit in the bag like the real thing.
  const sorted = featured(list).sort((a, b) => Number(!!b.cutout) - Number(!!a.cutout));
  const items = sorted.map(toPiece).filter((x): x is StudioPiece => !!x).slice(0, PER_TAB);
  return items.length ? { name, items } : null;
}

export function studioData(store: Store): StudioData {
  const live = store.live;
  const boxes: StudioBox[] = [];
  const used = new Set<string>();
  for (const { match, ...c } of CONTAINERS) {
    // Every product of the same kind gets the drawing (Space and Mermaid themed bags
    // both), each named for itself when there are several. A bag from another
    // category that happens to match the name keeps its own photo.
    const first = live.find((x) => match.test(x.name) && !used.has(x.sku));
    if (!first) continue;
    const same = live.filter((x) => match.test(x.name) && x.category_slug === first.category_slug && !used.has(x.sku));
    same.forEach((p, i) => {
      used.add(p.sku);
      const key = i === 0 ? c.key : `${c.key}-${p.sku.toLowerCase()}`;
      boxes.push({ ...c, key, name: same.length > 1 ? p.name : c.name, sku: p.sku, price: p.price, cap: capOf(p) });
    });
  }
  // The rest of the shop's bags, cheapest first, shown with their photo.
  const photoBags = live
    .filter((p) => BAG_SLUGS.includes(p.category_slug) && !used.has(p.sku) && !!(p.photoUrl ?? p.art))
    .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  for (const p of photoBags) {
    boxes.push({ ...PHOTO_BAG, key: p.sku.toLowerCase(), art: "", name: p.name, sku: p.sku, price: p.price, cap: capOf(p), img: (p.photoUrl ?? p.art)! });
  }
  const fillers = live.filter((p) => p.role === "filler" && p.tab);
  const rg = RG_TABS.map((t) => tab(t, fillers.filter((p) => p.tab === t)));
  const notWrap = live.filter((p) => p.role !== "packaging" && p.role !== "tag");
  const hm = [
    tab("Kids", notWrap.filter((p) => p.role === "hero" && p.sections.includes("kids"))),
    tab("For her", notWrap.filter((p) => !!p.herGroup)),
    tab("For him", notWrap.filter((p) => p.sections.includes("for-him"))),
    tab("Little extras", fillers),
  ];
  const tagP = live.find((p) => p.sku === "TAGS-001") ?? live.find((p) => p.role === "tag");
  return {
    boxes,
    tabs: { rg: rg.filter((t): t is StudioTab => !!t), hm: hm.filter((t): t is StudioTab => !!t) },
    tag: tagP ? { sku: tagP.sku, price: tagP.price, cap: capOf(tagP) } : null,
  };
}

/** Where the studio opens: ?mode=hampers, or ?from=<pack> to start from a ready-made pack. */
export function studioStart(store: Store, data: StudioData, q: { mode?: string; from?: string }): StudioStart {
  const pack = q.from ? PACKS.find((k) => k.id === q.from) : undefined;
  if (pack) {
    const bag = store.bySku.get(pack.bag);
    const box = bag ? data.boxes.find((b) => b.sku === bag.sku) : undefined;
    const items = pack.items.flatMap((it) => Array.from({ length: it.qty }, () => it.sku)).filter((s) => store.bySku.has(s));
    const extra = items.map((s) => store.bySku.get(s)!).map(toPiece).filter((x): x is StudioPiece => !!x);
    return { mode: "rg", box: box?.key, items: items.filter((s) => extra.some((x) => x.sku === s)), extra };
  }
  return { mode: q.mode === "hampers" ? "hm" : "rg" };
}
