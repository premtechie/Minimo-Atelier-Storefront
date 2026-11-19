import { describe, expect, it } from "vitest";
import { buildCatalogue, stockCap } from "@/lib/store";
import { PACKS } from "@/lib/merch";
import type { ApiProduct } from "@/lib/types";

const p = (sku: string, o: Partial<ApiProduct> = {}): ApiProduct => ({
  sku, name: sku, category: "Pencils", category_slug: "pencils", photo_version: null, price: 10, mrp: null,
  percent_off: 0, you_save: 0, availability: "in_stock", left: null, material: null, is_new: false, ...o,
});

describe("store", () => {
  it("caps orders by what is left", () => {
    expect(stockCap({ availability: "out_of_stock", left: null })).toBe(0);
    expect(stockCap({ availability: "few_left", left: 3 })).toBe(3);
    expect(stockCap({ availability: "in_stock", left: null })).toBe(Infinity);
  });

  it("hides sold-out products and packs that can't be made", () => {
    const k = PACKS[0];
    const skus = [k.bag, ...(k.tag ? [k.tag] : []), ...k.items.map((i) => i.sku)];
    const full = buildCatalogue({ categories: [], products: skus.map((s) => p(s)) });
    expect(full.packs.map((x) => x.id)).toContain(k.id);
    const pr = full.packs.find((x) => x.id === k.id)!;
    expect(pr.price).toBe(skus.reduce((s, sku) => s + 10 * (k.items.find((i) => i.sku === sku)?.qty ?? 1), 0));

    const gone = buildCatalogue({ categories: [], products: skus.map((s, i) => p(s, i === 0 ? { availability: "out_of_stock" } : {})) });
    expect(gone.packs.map((x) => x.id)).not.toContain(k.id);
    expect(gone.live).toHaveLength(skus.length - 1);
  });

  it("works offline with no catalogue", () => {
    expect(buildCatalogue(null)).toMatchObject({ ok: false, products: [], packs: [] });
  });
});
