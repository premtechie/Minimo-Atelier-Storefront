import type { ApiCatalogue, Pack, Product, ResolvedPack, Section } from "./types";
import { cardArtFor, cutoutFor, herGroupFor, PACKS, roleFor, sectionsFor, tabFor } from "./merch";
import { productHref } from "./format";

export type Store = {
  ok: boolean;
  products: Product[];
  /** Products a shopper can buy now (out of stock is hidden from lists, plan section 6). */
  live: Product[];
  bySku: Map<string, Product>;
  packs: ResolvedPack[];
};

export function toProduct(p: ApiCatalogue["products"][number]): Product {
  return {
    ...p,
    // Served from this site (src/app/img), never straight from the admin.
    photoUrl: p.photo_version ? `/img/${p.sku.toLowerCase()}?v=${p.photo_version}` : null,
    art: cardArtFor(p.category_slug, p.name),
    cutout: cutoutFor(p.category_slug),
    sections: sectionsFor(p.category_slug, p.name),
    role: roleFor(p.category_slug),
    tab: tabFor(p.category_slug),
    herGroup: herGroupFor(p.category_slug),
  };
}

/** What a shopper may order of one product: a few left means exactly that many. */
export function stockCap(p: Pick<Product, "availability" | "left">) {
  if (p.availability === "out_of_stock") return 0;
  if (p.availability === "few_left") return p.left ?? 1;
  return Infinity;
}

export function resolvePack(pack: Pack, bySku: Map<string, Product>): ResolvedPack | null {
  const bagProduct = bySku.get(pack.bag);
  if (!bagProduct) return null;
  const tagProduct = pack.tag ? bySku.get(pack.tag) ?? null : null;
  const parts: ResolvedPack["parts"] = [];
  for (const it of pack.items) {
    const product = bySku.get(it.sku);
    if (!product) return null; // a piece was deleted in the admin: the pack can't be made
    parts.push({ product, qty: it.qty });
  }
  const all = [...parts, { product: bagProduct, qty: 1 }, ...(tagProduct ? [{ product: tagProduct, qty: 1 }] : [])];
  const price = all.reduce((s, x) => s + x.product.price * x.qty, 0);
  const canMake = Math.min(...all.map((x) => Math.floor(stockCap(x.product) / x.qty)));
  return { ...pack, price, parts, bagProduct, tagProduct, canMake };
}

export function buildCatalogue(data: ApiCatalogue | null): Store {
  const products = (data?.products ?? []).map((p) => toProduct(p));
  const bySku = new Map(products.map((p) => [p.sku, p]));
  const packs = PACKS.map((k) => resolvePack(k, bySku)).filter((k): k is ResolvedPack => !!k && k.canMake > 0);
  return { ok: !!data, products, live: products.filter((p) => p.availability !== "out_of_stock"), bySku, packs };
}

export const inSection = (list: Product[], s: Section) => list.filter((p) => p.sections.includes(s));

/** Newest and photographed first, then cheapest: a stand-in for "popular" until the admin shares sales. */
export function featured(list: Product[]) {
  return [...list].sort((a, b) => Number(!!b.photoUrl) - Number(!!a.photoUrl) || Number(b.is_new) - Number(a.is_new) || a.price - b.price);
}

/** "Goes well with" picks: other bags and little extras that are in stock and have a picture. */
export function pairsFor(store: Store, opts: { skip: Set<string>; bags: number; extras: number; tab?: string | null }) {
  const ok = (p: Product) => !opts.skip.has(p.sku) && stockCap(p) > 0 && !!(p.photoUrl ?? p.art);
  const bags = featured(store.live.filter((p) => p.role === "packaging" && ok(p))).slice(0, opts.bags);
  const pool = store.live.filter((p) => p.role === "filler" && ok(p));
  const sameTab = opts.tab ? pool.filter((p) => p.tab === opts.tab) : [];
  const extras = featured(sameTab.length >= opts.extras ? sameTab : pool).slice(0, opts.extras);
  return [...bags, ...extras].map((p) => ({ sku: p.sku, name: p.name, price: p.price, img: (p.photoUrl ?? p.art)!, href: productHref(p.sku), cap: stockCap(p) }));
}
