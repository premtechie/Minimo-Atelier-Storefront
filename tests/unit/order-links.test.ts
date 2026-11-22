import { describe, expect, it } from "vitest";
import { buildCatalogue } from "@/lib/store";
import { orderLinks } from "@/lib/lite";
import { lineHref } from "@/lib/orders";
import { PACKS } from "@/lib/merch";
import type { ApiProduct } from "@/lib/types";

const p = (sku: string, o: Partial<ApiProduct> = {}): ApiProduct => ({
  sku, name: sku, category: "Pencils", category_slug: "pencils", photo_version: null, price: 10, mrp: null,
  percent_off: 0, you_save: 0, availability: "in_stock", left: null, material: null, is_new: false, ...o,
});

describe("order line links", () => {
  const k = PACKS[0];
  const skus = [k.bag, ...(k.tag ? [k.tag] : []), ...k.items.map((i) => i.sku)];
  const links = orderLinks(buildCatalogue({ categories: [], products: [...skus.map((s) => p(s)), p("GIFT-001", { availability: "out_of_stock" })] }));

  it("opens a product's own page by its SKU, sold out or not", () => {
    expect(lineHref({ sku: skus[0], name: "Anything" }, links)).toBe(`/product/${skus[0].toLowerCase()}`);
    expect(lineHref({ sku: "gift-001", name: "Gift Set With Box" }, links)).toBe("/product/gift-001");
  });

  it("opens a pack's page by the name the cart sent", () => {
    expect(lineHref({ sku: null, name: `${k.name} pack` }, links)).toBe(`/packs/${k.id}`);
    expect(lineHref({ sku: null, name: k.name }, links)).toBe(`/packs/${k.id}`);
  });

  it("leaves custom bags and products no longer on the site unlinked", () => {
    expect(lineHref({ sku: null, name: "Custom return-gift bag" }, links)).toBeNull();
    expect(lineHref({ sku: "GONE-001", name: "Old thing" }, links)).toBeNull();
  });
});
