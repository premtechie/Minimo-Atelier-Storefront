import type { Store } from "./store";
import { stockCap } from "./store";
import { packHref, productHref } from "./format";

/** The few fields the browser needs to price a cart or show a saved item. */
export type LiteItem = { id: string; name: string; price: number; cap: number | null; image: string | null; href: string; unit: string | null };

export function liteCatalogue(store: Store): LiteItem[] {
  return [
    ...store.products.map((p) => {
      const cap = stockCap(p);
      return {
        id: p.sku,
        name: p.name,
        price: p.price,
        cap: Number.isFinite(cap) ? cap : null,
        image: p.photoUrl ?? p.art,
        href: productHref(p.sku),
        unit: p.sections.includes("return-gifts") ? "per piece" : null,
      };
    }),
    ...store.packs.map((k) => ({ id: `pack:${k.id}`, name: k.name, price: k.price, cap: Number.isFinite(k.canMake) ? k.canMake : null, image: k.art, href: packHref(k.id), unit: "per guest" })),
  ];
}
